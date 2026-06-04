-- Promo code usage tracking: orders.discount_code_id + automatic use count sync.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_code_id uuid REFERENCES public.discount_codes(id);

CREATE INDEX IF NOT EXISTS orders_discount_code_id_idx
  ON public.orders (discount_code_id)
  WHERE discount_code_id IS NOT NULL;

-- Drop trigger before functions (dependency order).
DROP TRIGGER IF EXISTS orders_discount_code_uses ON public.orders;

-- Postgres cannot change return type via CREATE OR REPLACE; drop first.
DROP FUNCTION IF EXISTS public.increment_code_uses(uuid);
DROP FUNCTION IF EXISTS public.decrement_code_uses(uuid);
DROP FUNCTION IF EXISTS public.sync_discount_code_uses();

-- Atomic increment (respects max_uses); returns true when a row was updated.
CREATE FUNCTION public.increment_code_uses(code_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discount_codes
  SET uses = uses + 1
  WHERE id = code_id
    AND active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses < max_uses);
  RETURN FOUND;
END;
$$;

CREATE FUNCTION public.decrement_code_uses(code_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discount_codes
  SET uses = GREATEST(0, uses - 1)
  WHERE id = code_id;
  RETURN FOUND;
END;
$$;

-- Reconcile discount_codes.uses from completed orders (idempotent backfill).
CREATE FUNCTION public.sync_discount_code_uses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discount_codes dc
  SET uses = COALESCE(stats.cnt, 0)
  FROM (
    SELECT discount_code_id, COUNT(*)::integer AS cnt
    FROM public.orders
    WHERE discount_code_id IS NOT NULL
      AND status = 'completed'
    GROUP BY discount_code_id
  ) stats
  WHERE dc.id = stats.discount_code_id;

  UPDATE public.discount_codes dc
  SET uses = 0
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.discount_code_id = dc.id
      AND o.status = 'completed'
  )
  AND dc.uses <> 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.orders_discount_code_uses_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.discount_code_id IS NOT NULL AND NEW.status = 'completed' THEN
      PERFORM public.increment_code_uses(NEW.discount_code_id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.discount_code_id IS NOT NULL
      AND OLD.status = 'completed'
      AND NEW.status IN ('refunded', 'cancelled')
    THEN
      PERFORM public.decrement_code_uses(NEW.discount_code_id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_discount_code_uses
  AFTER INSERT OR UPDATE OF status, discount_code_id ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_discount_code_uses_trigger();

GRANT EXECUTE ON FUNCTION public.increment_code_uses(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_code_uses(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_discount_code_uses() TO service_role;

-- One-time reconcile for existing completed orders (discount_cents only; no code id until new checkouts).
SELECT public.sync_discount_code_uses();
