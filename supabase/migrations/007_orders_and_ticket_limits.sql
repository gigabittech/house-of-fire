-- Orders group tickets from a single checkout / PaymentIntent.
-- Enforces multi-ticket purchase with idempotent fulfillment keyed on stripe_payment_intent_id.

CREATE TABLE IF NOT EXISTS public.orders (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL REFERENCES public.profiles(id),
  event_id                  uuid NOT NULL REFERENCES public.events(id),
  tier_id                   uuid NOT NULL REFERENCES public.ticket_tiers(id),
  quantity                  integer NOT NULL CHECK (quantity >= 1 AND quantity <= 4),
  subtotal_cents            integer NOT NULL,
  discount_cents            integer NOT NULL DEFAULT 0,
  fee_cents                 integer NOT NULL DEFAULT 0,
  total_cents               integer NOT NULL,
  stripe_payment_intent_id  text NOT NULL UNIQUE,
  status                    text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_event_id_idx ON public.orders (event_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Crew can read all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('crew', 'admin')
    )
  );

CREATE POLICY "Service role can manage orders"
  ON public.orders FOR ALL
  USING (true)
  WITH CHECK (true);

-- Link tickets to orders; payment intent lives on the order only.
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id);

CREATE INDEX IF NOT EXISTS tickets_order_id_idx ON public.tickets (order_id);

-- Drop per-ticket PI uniqueness (multi-ticket orders use orders.stripe_payment_intent_id).
ALTER TABLE public.tickets
  DROP CONSTRAINT IF EXISTS tickets_stripe_payment_intent_id_key;

-- Count active tickets a user holds for an event (anti-scalping).
CREATE OR REPLACE FUNCTION public.user_event_ticket_count(p_user_id uuid, p_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT count(*)::integer
  FROM public.tickets
  WHERE holder_id = p_user_id
    AND event_id = p_event_id
    AND status NOT IN ('transferred', 'refunded', 'cancelled');
$$;
