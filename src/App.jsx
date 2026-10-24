import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownLeft, ArrowUpRight, Bell, ChevronDown, CircleHelp, Eye, EyeOff, LayoutDashboard, LineChart, Menu, Search, ShieldCheck, Wallet, X } from 'lucide-react';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const fallbackQuotes = [
  {symbol:'NIFTY 50',name:'Nifty 50',price:24854.05,change:0.72},
  {symbol:'SENSEX',name:'BSE Sensex',price:81745.62,change:0.58},
  {symbol:'BANKNIFTY',name:'Nifty Bank',price:56102.80,change:0.41},
  {symbol:'RELIANCE',name:'Reliance Industries',price:1428.50,change:-0.34},
  {symbol:'TCS',name:'Tata Consultancy Services',price:3190.20,change:0.81},
  {symbol:'INFY',name:'Infosys',price:1512.75,change:1.13},
];
const money = n => Number(n).toLocaleString('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2});
function App(){
  const [quotes,setQuotes]=useState(fallbackQuotes);
  const [status,setStatus]=useState('Demo data');
  const [query,setQuery]=useState('');
  const [active,setActive]=useState('Overview');
  const [showBalance,setShowBalance]=useState(true);
  const [menuOpen,setMenuOpen]=useState(false);
  const [apiState,setApiState]=useState('Checking API…');
  useEffect(()=>{
    let alive=true;
    fetch(`${API}/market/quotes`).then(r=>{if(!r.ok)throw new Error('API unavailable');return r.json()})
      .then(d=>{if(!alive)return;const raw=d.quotes||d.data||[];if(raw.length)setQuotes(raw.map(q=>({symbol:q.symbol||q.ticker||'—',name:q.name||q.symbol||'Market quote',price:Number(q.price??q.lastPrice??q.value??0),change:Number(q.changePercent??q.change??0)})));setStatus(d.isLive?'Live market data':'Demo data');setApiState('Backend connected')})
      .catch(()=>{if(alive){setStatus('Demo data');setApiState('Backend not connected')}});
    return ()=>{alive=false};
  },[]);
  const filtered=useMemo(()=>quotes.filter(q=>(q.symbol+' '+q.name).toLowerCase().includes(query.toLowerCase())),[quotes,query]);
  const nav=['Overview','Markets','Watchlist','Portfolio','Orders'];
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen?'show':''}`}>
      <div className="brand"><div className="brand-mark">B</div><span>Bharat<span className="brand-light">Trade</span></span><button className="icon-btn mobile-close" onClick={()=>setMenuOpen(false)}><X size={18}/></button></div>
      <div className="workspace-label">TRADING WORKSPACE</div>
      {nav.map((n,i)=><button key={n} onClick={()=>{setActive(n);setMenuOpen(false)}} className={`nav-item ${active===n?'selected':''}`}>{[<LayoutDashboard/>,<LineChart/>,<Activity/>,<Wallet/>,<ArrowUpRight/>][i]}<span>{n}</span>{n==='Orders'&&<span className="nav-soon">API</span>}</button>)}
      <div className="sidebar-bottom"><div className="secure-card"><ShieldCheck size={20}/><b>Security first</b><p>Broker credentials belong on the backend, never in the browser.</p></div><div className="user-row"><div className="avatar">BT</div><div><b>Trader account</b><small>Broker not connected</small></div><ChevronDown size={16}/></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="icon-btn menu-toggle" onClick={()=>setMenuOpen(true)}><Menu/></button><div className="crumb">Workspace <span>/</span> <b>{active}</b></div><div className="top-actions"><span className="api-status"><i className={apiState==='Backend connected'?'green-dot':'amber-dot'}></i>{apiState}</span><button className="icon-btn" aria-label="Help"><CircleHelp/></button><button className="icon-btn" aria-label="Notifications"><Bell/></button><div className="avatar">R</div></div></header>
      <div className="content">
        <div className="welcome"><div><p className="eyebrow">MONDAY, MARKET OVERVIEW</p><h1>{active==='Overview'?'Good morning, Trader':active}</h1><p className="muted">Track markets and manage your trading workspace.</p></div><div className="market-state"><span className="state-dot"></span>{status}<ChevronDown size={15}/></div></div>
        <div className="notice"><ShieldCheck size={19}/><div><b>Live trading is not enabled</b><p>Connect a supported broker API and complete its authorization before sending real orders. Displayed sample values are not executable prices.</p></div></div>
        <section className="metrics">
          <div className="metric-card balance-card"><div className="metric-head"><span>Account value</span><button className="plain-icon" onClick={()=>setShowBalance(!showBalance)}>{showBalance?<Eye size={17}/>:<EyeOff size={17}/>}</button></div><h2>{showBalance?'₹—':'••••••'}</h2><div className="metric-foot"><span className="neutral-pill">Broker not connected</span></div></div>
          <div className="metric-card"><div className="metric-head">Day's P&amp;L <span className="metric-icon green"><ArrowUpRight size={18}/></span></div><h2>₹—</h2><div className="metric-foot muted">Available after broker connection</div></div>
          <div className="metric-card"><div className="metric-head">Invested value <span className="metric-icon blue"><Wallet size={18}/></span></div><h2>₹—</h2><div className="metric-foot muted">No portfolio synced</div></div>
          <div className="metric-card"><div className="metric-head">Open orders <span className="metric-icon purple"><Activity size={18}/></span></div><h2>—</h2><div className="metric-foot muted">Order execution disabled</div></div>
        </section>
        <section className="market-panel">
          <div className="panel-header"><div><h3>Market watch</h3><p className="muted">Indices and popular symbols</p></div><div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search symbol"/></div></div>
          <div className="table-wrap"><table><thead><tr><th>Instrument</th><th>Last price</th><th>Change</th><th>Trend</th></tr></thead><tbody>{filtered.map((q,i)=><tr key={q.symbol}><td><div className="instrument"><div className="symbol-icon">{q.symbol.slice(0,1)}</div><div><b>{q.name}</b><small>{q.symbol}</small></div></div></td><td className="price">{money(q.price)}</td><td><span className={`change ${q.change>=0?'positive':'negative'}`}>{q.change>=0?'+':''}{q.change.toFixed(2)}%</span></td><td><Sparkline positive={q.change>=0} seed={i}/></td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty">No matching instruments.</div>}</div>
          <div className="panel-foot"><span className="muted">Market data may be illustrative until a provider is configured.</span><button className="text-btn" onClick={()=>{setQuery('');setActive('Markets')}}>View markets <ArrowUpRight size={15}/></button></div>
        </section>
        <section className="bottom-grid"><div className="market-panel compact"><div className="panel-header"><div><h3>Portfolio</h3><p className="muted">Your holdings at a glance</p></div><Wallet size={19} className="muted"/></div><div className="empty-state"><div className="empty-graphic"><Wallet size={25}/></div><b>Connect a broker to sync holdings</b><p>Holdings, average price, and unrealized P&amp;L will appear here after secure authorization.</p></div></div>
        <div className="market-panel compact"><div className="panel-header"><div><h3>Recent orders</h3><p className="muted">Order status and execution details</p></div><ArrowUpRight size={19} className="muted"/></div><div className="empty-state"><div className="empty-graphic"><Activity size={25}/></div><b>No orders to show</b><p>Real order placement stays locked until broker credentials and risk controls are configured.</p></div></div></section>
        <footer><span>© 2026 BharatTrade</span><span><ShieldCheck size={14}/> Secure by design</span><span className="footer-disclaimer">Trading involves risk. This starter is not investment advice.</span></footer>
      </div>
    </main>
  </div>
}
function Sparkline({positive,seed}){const vals=Array.from({length:18},(_,i)=>35+Math.sin(i*.8+seed)*12+Math.cos(i*.34+seed)*9+(positive?i*.6:-i*.5));const points=vals.map((v,i)=>`${i*5},${35-v}`).join(' ');return <svg className="sparkline" viewBox="0 0 85 40" role="img" aria-label={positive?'Upward trend illustration':'Downward trend illustration'}><polyline points={points} fill="none" stroke={positive?'#0b9b72':'#e45d67'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
export default App;
