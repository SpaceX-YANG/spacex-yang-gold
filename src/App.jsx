import React, { useState, useEffect, useRef } from 'react';

// --- 全局样式与字体注入 (金黄色极客风) ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
    
    :root {
      --bg-dark: #050505;
      --gold: #FFB800; 
      --gold-vibrant: #FFD700; 
    }
    body {
      margin: 0;
      background-color: var(--bg-dark);
      color: white;
      font-family: 'JetBrains Mono', monospace;
      overflow-x: hidden;
      cursor: none; 
    }
    h1, h2, h3, h4, h5, h6, .font-inter {
      font-family: 'Inter', sans-serif;
    }
    
    ::-webkit-scrollbar { width: 0px; background: transparent; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 184, 0, 0.5); border-radius: 10px; }
    
    @keyframes blink { 50% { opacity: 0; } }
    .caret { animation: blink 1s step-end infinite; }
    
    .glow-bg {
      position: fixed;
      width: 100vw; height: 100vh;
      background: conic-gradient(from 180deg at 50% 50%, rgba(255, 184, 0, 0.1) 0deg, rgba(5, 5, 5, 0) 180deg, rgba(255, 184, 0, 0.1) 360deg);
      filter: blur(80px);
      z-index: -1;
      pointer-events: none;
    }
  `}</style>
);

// --- Custom Hook: Neon Cursor ---
const useSmoothMouse = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      targetPosition.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    let animationFrameId;
    const render = () => {
      setMousePosition((prev) => ({
        x: prev.x + (targetPosition.current.x - prev.x) * 0.15,
        y: prev.y + (targetPosition.current.y - prev.y) * 0.15,
      }));
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    return () => { window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(animationFrameId); };
  }, []);
  return mousePosition;
};

// --- Component: Algorithmic Donut (修复手机端无法滚动) ---
const AlgorithmicDonut = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, isHovering: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth; let height = window.innerHeight;
    canvas.width = width; canvas.height = height;

    const particles = [];
    const R = 180; const r = 60; const density = 40;

    for (let i = 0; i < density; i++) {
      for (let j = 0; j < density; j++) {
        const u = (i / density) * Math.PI * 2;
        const v = (j / density) * Math.PI * 2;
        const x = (R + r * Math.cos(v)) * Math.cos(u);
        const y = (R + r * Math.cos(v)) * Math.sin(u);
        const z = r * Math.sin(v);
        particles.push({ ox: x, oy: y, oz: z, x, y, z, vx: 0, vy: 0, vz: 0 });
      }
    }

    let angleX = 0; let angleY = 0;
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const scrollY = window.scrollY;
      const opacity = Math.max(0, 1 - scrollY / 600);
      ctx.fillStyle = `rgba(255, 215, 0, ${opacity * 0.8})`; 

      angleX += 0.005; angleY += 0.007;
      const cosX = Math.cos(angleX); const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY); const sinY = Math.sin(angleY);

      particles.forEach(p => {
        if (mouseRef.current.isHovering) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) { p.vx += (dx / dist) * 2; p.vy += (dy / dist) * 2; }
        }
        p.vx += (p.ox - p.x) * 0.05; p.vy += (p.oy - p.y) * 0.05; p.vz += (p.oz - p.z) * 0.05;
        p.vx *= 0.85; p.vy *= 0.85; p.vz *= 0.85;
        p.x += p.vx; p.y += p.vy; p.z += p.vz;

        let y1 = p.y * cosX - p.z * sinX; let z1 = p.y * sinX + p.z * cosX;
        let x2 = p.x * cosY + z1 * sinY; let z2 = -p.x * sinY + z1 * cosY;

        const fov = 600; const scale = fov / (fov + z2);
        const screenX = width / 2 + x2 * scale; const screenY = height / 2 + y1 * scale;
        const size = Math.max(0.5, 2 * scale);
        
        ctx.globalAlpha = Math.max(0.1, scale - 0.5) * opacity;
        ctx.beginPath(); ctx.arc(screenX, screenY, size, 0, Math.PI * 2); ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    const handleResize = () => { width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height; };
    const handleGlobalMouseMove = (e) => { mouseRef.current = { x: e.clientX - width / 2, y: e.clientY - height / 2, isHovering: true }; };
    const handleGlobalTouchMove = (e) => { if (e.touches.length > 0) { mouseRef.current = { x: e.touches[0].clientX - width / 2, y: e.touches[0].clientY - height / 2, isHovering: true }; } };
    const handleMouseLeave = () => { mouseRef.current.isHovering = false; };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchend', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none mix-blend-screen" />;
};

// --- Component: Gold Trend Chart ---
const GoldTrendChart = () => {
  const chartRef = useRef(null);
  
  // 草图数据区
  const mockGoldData = [
    { time: '00:00', price: 1145 },
    { time: '01:00', price: 1139 },
    { time: '02:00', price: 1140 },
    { time: '03:00', price: 1144 },
    { time: '04:00', price: 1145 },
    { time: '05:00', price: 1141 },
    { time: '06:00', price: 1142 },
    { time: '07:00', price: 1145 },
    { time: '08:00', price: 1144 },
    { time: '09:00', price: 1152 },
    { time: '10:00', price: 1160 },
    { time: '11:00', price: 1152 },
    { time: '12:00', price: 1155 },
    { time: '13:00', price: 1152 },
    { time: '14:00', price: 1149 },
    { time: '15:00', price: 1154 },
    { time: '15:30', price: 1153 }, 
  ];

  // 核心容错引擎
  const validData = mockGoldData.filter(d => d && d.time && typeof d.price !== 'undefined' && !isNaN(Number(d.price)));
  const prices = validData.map(d => Number(d.price));

  if (validData.length === 0) return null;

  // 动态计算极值和索引
  const dataMin = Math.min(...prices);
  const dataMax = Math.max(...prices);
  const minIndex = prices.indexOf(dataMin);
  const maxIndex = prices.indexOf(dataMax);
  
  const padding = (dataMax - dataMin) * 0.2 || 1; 
  const minPrice = dataMin - padding;
  const maxPrice = dataMax + padding;

  const currentPrice = prices[prices.length - 1].toFixed(2);
  const closingTime = validData[validData.length - 1].time; 

  const chartWidth = 500; 
  const chartHeight = 150;

  const generatePath = () => {
    if (validData.length < 2) return '';
    const points = validData.map((d, i) => {
      const x = (i / (validData.length - 1)) * chartWidth;
      const y = chartHeight - ((Number(d.price) - minPrice) / (maxPrice - minPrice)) * chartHeight;
      return `${x},${y}`;
    }).join(' L '); 

    return `M ${points}`;
  };

  const mobileLabelStep = Math.max(1, Math.ceil(validData.length / 5));

  return (
    <div ref={chartRef} className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl backdrop-blur-md relative overflow-hidden flex flex-col justify-between group h-auto min-h-[300px]">
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#FFD700] to-transparent rounded-bl-full opacity-5 group-hover:opacity-15 transition-opacity blur-2xl pointer-events-none"></div>
      
      {/* 头部 */}
      <div className="flex justify-between items-start z-10 w-full mb-6">
        <h3 className="text-2xl font-inter font-bold text-white group-hover:text-[#FFD700] transition-colors mt-1">Gold Trend.</h3>
        <div className="text-right">
          <span className="font-mono text-xl md:text-2xl font-black text-[#FFD700] mix-blend-screen leading-none block">￥{currentPrice}</span>
          <span className="font-mono text-[10px] text-[#FFD700]/70 block mt-1">({closingTime} 收盘价格)</span>
        </div>
      </div>

      {/* SVG 图表区 */}
      <div className="w-full relative flex items-center justify-center h-[150px] md:h-[200px]">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full mix-blend-screen opacity-90 overflow-visible">
          <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="rgba(255,184,0,0.05)" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,184,0,0.05)" strokeWidth="0.5" />
          <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="rgba(255,184,0,0.05)" strokeWidth="0.5" />
          
          <path d={generatePath()} fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" 
            style={{ filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.4))' }} />
          
          {validData.map((d, i) => {
             const x = (i / (validData.length - 1)) * chartWidth;
             const y = chartHeight - ((Number(d.price) - minPrice) / (maxPrice - minPrice)) * chartHeight;
             const isLast = i === validData.length - 1;
             const isMax = i === maxIndex;
             const isMin = i === minIndex;
             
             let textAnchor = "middle";
             if (i === 0) textAnchor = "start";
             if (i === validData.length - 1) textAnchor = "end";

             return (
               <g key={i}>
                 <circle cx={x} cy={y} r={isLast || isMax || isMin ? 3.5 : 2} fill={isLast || isMax || isMin ? "#FFD700" : "rgba(255,255,255,0.3)"} className="transition-all duration-300" />
                 
                 {isMax && (
                   <text x={x} y={y - 12} fill="#FFD700" fontSize="11" fontFamily="JetBrains Mono, monospace" textAnchor={textAnchor} fontWeight="bold" className="drop-shadow-md">
                     {d.price}
                   </text>
                 )}

                 {isMin && !isMax && (
                   <text x={x} y={y + 18} fill="#FFD700" fontSize="11" fontFamily="JetBrains Mono, monospace" textAnchor={textAnchor} fontWeight="bold" className="drop-shadow-md">
                     {d.price}
                   </text>
                 )}
               </g>
             );
          })}
        </svg>
      </div>

      {/* 底部时间标签 */}
      <div className="w-full flex justify-between text-[9px] sm:text-[10px] md:text-xs text-white/40 font-mono pt-4 mt-6 border-t border-white/10 relative z-10">
        {validData.map((d, i) => {
          const isFirst = i === 0;
          const isLast = i === validData.length - 1;
          const showOnMobile = isFirst || isLast || (i % mobileLabelStep === 0);

          return (
            <span 
              key={i} 
              className={`shrink-0 ${showOnMobile ? 'block' : 'hidden md:block'} ${isLast ? 'text-[#FFD700] font-bold' : ''}`}
            >
              {d.time}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const { x, y } = useSmoothMouse();

  return (
    <>
      <GlobalStyles />
      
      {/* 金黄色发光鼠标 */}
      <div 
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[100] mix-blend-screen hidden md:block"
        style={{ transform: `translate(${x - 16}px, ${y - 16}px)`, background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0) 70%)', boxShadow: '0 0 20px 5px rgba(255,215,0,0.4)' }}
      />

      <div className="glow-bg" />
      
      <AlgorithmicDonut />

      <main className="relative z-10 w-full min-h-screen flex flex-col justify-between">
        {/* --- HERO AREA --- */}
        <section className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden min-h-[50vh]">
          <div className="text-center pointer-events-none mix-blend-difference mt-[-5vh]">
            <h1 className="text-6xl sm:text-7xl md:text-9xl font-inter font-black tracking-tighter uppercase text-transparent [-webkit-text-stroke:2px_white] leading-none mb-6">
              SpaceX<br/><span className="text-white [-webkit-text-stroke:0px]">YANG</span>
            </h1>
            
            {/* 🎯 终极修改点：强制分成独立的上下两行！ */}
            <p className="mt-4 text-lg md:text-2xl text-white/80 uppercase tracking-[0.2em] font-bold leading-relaxed">
              <span className="block">Seeking Fortune,</span>
              <span className="block text-[#FFD700]">Avoiding Peril.<span className="caret">_</span></span>
            </p>
            
            <p className="mt-4 text-xs md:text-sm text-white/50 tracking-[0.1em] font-mono px-4">
              Synthesis of esoteric and systemic vectors to optimize trajectory and capture tranquil opportunities.
            </p>
          </div>
        </section>

        {/* --- GOLD TREND CHART AREA --- */}
        <section id="gold-chart" className="max-w-6xl mx-auto w-full px-6 pb-20 relative z-10">
          <GoldTrendChart />
        </section>

        {/* --- FOOTER --- */}
        <footer className="border-t border-white/10 py-8 text-center text-white/40 text-xs md:text-sm font-mono reltive z-10">
          <p>© {new Date().getFullYear()} SPACEX—YANG. QUANTUM GATES INITIALIZED.</p>
        </footer>
      </main>

    </>
  );
}