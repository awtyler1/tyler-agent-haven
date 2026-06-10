// Calm, theme-matching loader used for route chunk loads and in-page data
// fetches. Bone background + a small gold spinner — no full-screen flash,
// no layout jump, so transitions feel seamless.
export function ContentLoader({ message }: { message?: string }) {
  return (
    <div className="tig-cl">
      <style>{`
        .tig-cl{ flex:1 1 auto; min-height:60vh; display:flex; align-items:center; justify-content:center; background:#F4F1E8; }
        .tig-cl__w{ display:flex; flex-direction:column; align-items:center; gap:12px; }
        .tig-cl__s{ width:26px; height:26px; border-radius:50%; border:2.5px solid rgba(168,128,31,.2); border-top-color:#A8801F; animation:tigcl .7s linear infinite; }
        .tig-cl__m{ font-size:12.5px; color:#6b6457; }
        @keyframes tigcl{ to{ transform:rotate(360deg); } }
        @media (prefers-reduced-motion: reduce){ .tig-cl__s{ animation-duration:1.6s; } }
      `}</style>
      <div className="tig-cl__w">
        <div className="tig-cl__s" />
        {message && <div className="tig-cl__m">{message}</div>}
      </div>
    </div>
  );
}
