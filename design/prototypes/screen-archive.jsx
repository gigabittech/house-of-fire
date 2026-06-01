// screen-archive.jsx — Past Events Archive

function ScreenArchive({ nav, onBack, startUploadOpen = false }) {
  const [year, setYear] = React.useState('2026');
  const [uploadOpen, setUploadOpen] = React.useState(startUploadOpen);

  const events2026 = [
    { ed: 23, title: 'Late Bloom',   date: 'May 30',  att: 312, photos: 187, h: 240 },
    { ed: 22, title: 'Slow Burn',    date: 'Apr 25',  att: 298, photos: 142, h: 200 },
    { ed: 21, title: 'The Equinox',  date: 'Mar 28',  att: 305, photos: 218, h: 240 },
    { ed: 20, title: 'Hothouse',     date: 'Feb 22',  att: 280, photos: 156, h: 200 },
    { ed: 19, title: 'Cold Open',    date: 'Jan 31',  att: 275, photos: 95,  h: 240 },
    { ed: 18, title: 'Last Light',   date: 'Dec 28',  att: 311, photos: 264, h: 200 },
  ];

  return (
    <HofScreen>
      <HofScroll>
        <div style={{ height: 54 }}/>

        {/* Title */}
        <div style={{ padding: '12px 16px 4px' }}>
          <div style={{
            fontFamily: 'Inter', fontSize: 10, color: HOF.amber,
            letterSpacing: '0.22em', textTransform: 'uppercase',
          }}>The Archive</div>
          <div style={{
            fontFamily: 'Clash Display', fontWeight: 700, fontSize: 44,
            color: HOF.text, letterSpacing: '-0.02em', lineHeight: 1, marginTop: 6,
            textTransform: 'uppercase',
          }}>Every<br/>edition.</div>
          <div style={{
            fontFamily: 'Inter', fontSize: 14, color: HOF.textSec, marginTop: 12,
            lineHeight: 1.5, maxWidth: 280, textWrap: 'pretty',
          }}>
            Every event. Every month. Since April 2024.
          </div>
        </div>

        {/* Year filter */}
        <div style={{
          padding: '20px 16px 16px',
          display: 'flex', gap: 6, overflowX: 'auto',
        }}>
          {['2026', '2025', '2024'].map(y => (
            <button key={y} className="hof-btn hof-press" onClick={() => setYear(y)}
                    style={{
                      padding: '8px 16px',
                      background: year === y ? HOF.amber : HOF.surface,
                      border: `1px solid ${year === y ? HOF.amber : HOF.border}`,
                      color: year === y ? HOF.bg : HOF.text,
                      borderRadius: 999, fontFamily: 'Inter', fontWeight: 500, fontSize: 13,
                    }}>{y}</button>
          ))}
        </div>

        {/* Grid */}
        <div style={{
          padding: '0 12px 24px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          {events2026.map((e, i) => (
            <button key={e.ed} className="hof-btn hof-press"
                    style={{ textAlign: 'left', padding: 0,
                             background: 'transparent', borderRadius: 10, overflow: 'hidden' }}>
              <HofPhoto seed={i} gradient={false}
                        style={{ width: '100%', height: e.h, borderRadius: 10 }}>
                {/* gradient + meta */}
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(180deg, transparent, rgba(10,10,8,0.95))',
                  padding: '40px 12px 12px',
                }}>
                  <div style={{
                    fontFamily: 'Inter', fontSize: 9, color: HOF.amber,
                    letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 2,
                  }}>{e.date} · 2026</div>
                  <div style={{
                    fontFamily: 'Clash Display', fontWeight: 600, fontSize: 18,
                    color: HOF.text, letterSpacing: '-0.01em', lineHeight: 1.05,
                  }}>{e.title}</div>
                  <div style={{
                    fontFamily: 'Inter', fontSize: 10, color: HOF.textSec, marginTop: 6,
                    display: 'flex', gap: 10,
                  }}>
                    <span><Icon name="users" size={10} color={HOF.textSec} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }}/>{e.att}</span>
                    <span><Icon name="image" size={10} color={HOF.textSec} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }}/>{e.photos}</span>
                  </div>
                </div>
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  fontFamily: 'JetBrains Mono', fontSize: 10, color: HOF.text,
                  background: 'rgba(10,10,8,0.6)', padding: '3px 7px', borderRadius: 4,
                  backdropFilter: 'blur(4px)',
                }}>Nº{String(e.ed).padStart(2,'0')}</div>
              </HofPhoto>
            </button>
          ))}
        </div>

        <HofHomeSpacer/>
      </HofScroll>

      <HofBottomNav active="events" onChange={nav}/>

      {/* Photo submission FAB */}
      <button className="hof-btn hof-press" onClick={() => setUploadOpen(true)}
              aria-label="Submit your photos"
              style={{
                position: 'absolute', right: 18, bottom: 110, zIndex: 25,
                height: 48, padding: '0 18px 0 14px', borderRadius: 24,
                background: HOF.amber,
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 24px rgba(232,101,26,0.35), 0 2px 4px rgba(0,0,0,0.4)',
              }}>
        <Icon name="camera" size={18} color={HOF.bg}/>
        <span style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 500, color: HOF.bg }}>
          Submit photos
        </span>
      </button>

      <PhotoSubmitSheet open={uploadOpen} onClose={() => setUploadOpen(false)} edition={23}/>
    </HofScreen>
  );
}

Object.assign(window, { ScreenArchive });
