import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, Bell, ChevronDown, CircleHelp, Eye, EyeOff, LayoutDashboard, LineChart, Menu, Search, ShieldCheck, Wallet, X, RefreshCw, Star } from 'lucide-react';

const API = (import.meta.env.VITE_API_BASE_URL || 'https://backend-s6ea.onrender.com/api').replace(/\/$/, '');
const sampleQuotes = [
  {symbol:'NIFTY 50',name:'Nifty 50',price:24854.05,change:0.72},
  {symbol:'SENSEX',name:'BSE Sensex',price:81745.62,change:0.58},
  {symbol:'BANKNIFTY',name:'Nifty Bank',price:56102.80,change:0.41},
  {symbol:'RELIANCE',name:'Reliance Industries',price:1428.50,change:-0.34},
  {symbol:'TCS',name:'Tata Consultancy Services',price:3190.20,change:0.81},
  {symbol:'INFY',name:'Infosys',price:1512.75,change:1.13}
];
const money = n => Number(n || 0).toLocaleString('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2});

function App(){
  const [quotes,setQuotes]=useState(sampleQuotes);
  const [status,setStatus]=useState('Demo data');
  const [apiState,setApiState]=useState('Checking API…');
  const [active,setActive]=useState('Overview');
  const [query,setQuery]=useState('');
  const [showBalance,setShowBalance]=useState(true);
  const [menuOpen,setMenuOpen]=useState(false);
  const [watchlist,setWatchlist]=useState(['NIFTY 50','RELIANCE']);
  const [orders,setOrders]=useState([]);
  const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(false);
  const [side,setSide]=useState('Buy');
  const [symbol,setSymbol]=useState('RELIANCE');
  const [qty,setQty]=useState('1');
  const [orderType,setOrderType]=useState('Market');
  const [updated,setUpdated]=useState('');
  const [profile,setProfile]=useState({name:'Trader',email:'',phone:''});
  const [fundAmount,setFundAmount]=useState('');
  const [fundRequests,setFundRequests]=useState([]);

  const refreshQuotes=async()=>{
    setLoading(true);
    setNotice('');
    const symbols=[
      {symbol:'NIFTY 50',name:'Nifty 50',yahoo:'^NSEI'},
      {symbol:'SENSEX',name:'BSE Sensex',yahoo:'^BSESN'},
      {symbol:'BANKNIFTY',name:'Nifty Bank',yahoo:'^NSEBANK'},
      {symbol:'RELIANCE',name:'Reliance Industries',yahoo:'RELIANCE.NS'},
      {symbol:'TCS',name:'Tata Consultancy Services',yahoo:'TCS.NS'},
      {symbol:'INFY',name:'Infosys',yahoo:'INFY.NS'}
    ];
    try{
      const results=await Promise.allSettled(symbols.map(async item=>{
        const url='https://proxy.cors.dev/https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(item.yahoo)+'?range=1d&interval=1d';
        const response=await fetch(url,{headers:{Accept:'application/json'},cache:'no-store'});
        if(!response.ok) throw new Error('Quote request failed');
        const json=await response.json();
        const meta=json?.chart?.result?.[0]?.meta;
        const price=Number(meta?.regularMarketPrice);
        const previous=Number(meta?.chartPreviousClose??meta?.previousClose);
        if(!Number.isFinite(price)||price<=0) throw new Error('No quote');
        return {...item,price,change:previous>0?((price-previous)/previous)*100:0};
      }));
      const liveRows=results.filter(x=>x.status==='fulfilled').map(x=>x.value);
      if(liveRows.length){
        setQuotes(liveRows);
        setStatus('Yahoo Finance data · may be delayed');
        setApiState('Public market API connected');
        setUpdated(new Date().toLocaleTimeString());
        if(liveRows.length<symbols.length) setNotice('Some symbols could not load. Only the successfully returned quotes are shown.');
      }else{
        throw new Error('Public quote API unavailable');
      }
    }catch{
      try{
        const response=await fetch(API+'/market/quotes');
        if(!response.ok) throw new Error('Backend API unavailable');
        const data=await response.json();
        const rows=data.quotes||data.data||[];
        if(!rows.length) throw new Error('No backend quotes');
        setQuotes(rows.map(q=>({symbol:q.symbol||q.ticker||'—',name:q.name||q.symbol||'Market quote',price:Number(q.price??q.lastPrice??q.value??0),change:Number(q.changePercent??q.change??0)})));
        setStatus(data.isLive?'Backend market data':'Backend data — verify source');
        setApiState('Backend connected');
        setUpdated(new Date().toLocaleTimeString());
        setNotice('Public market API was unavailable; showing backend-provided quotes. Verify their source and delay.');
      }catch{
        setStatus('Demo data');
        setApiState('Market API unavailable');
        setNotice('Public market API did not respond. Displayed sample values are not live prices.');
      }
    }finally{setLoading(false);}
  };
  useEffect(()=>{refreshQuotes();},[]);
  useEffect(()=>{try{const w=JSON.parse(localStorage.getItem('bt-watchlist')||'null');if(Array.isArray(w))setWatchlist(w);const o=JSON.parse(localStorage.getItem('bt-demo-orders')||'[]');if(Array.isArray(o))setOrders(o);const p=JSON.parse(localStorage.getItem('bt-profile')||'null');if(p&&typeof p==='object')setProfile(p);const f=JSON.parse(localStorage.getItem('bt-fund-requests')||'[]');if(Array.isArray(f))setFundRequests(f);}catch{}},[]);
  useEffect(()=>{try{localStorage.setItem('bt-watchlist',JSON.stringify(watchlist));}catch{}},[watchlist]);
  useEffect(()=>{try{localStorage.setItem('bt-demo-orders',JSON.stringify(orders));}catch{}},[orders]);
  useEffect(()=>{try{localStorage.setItem('bt-fund-requests',JSON.stringify(fundRequests));}catch{}},[fundRequests]);

  const filtered=useMemo(()=>quotes.filter(q=>(q.symbol+' '+q.name).toLowerCase().includes(query.toLowerCase())),[quotes,query]);
  const visible=active==='Watchlist'?filtered.filter(q=>watchlist.includes(q.symbol)):filtered;
  const go=page=>{setActive(page);setMenuOpen(false);setNotice('');};
  const toggleWatch=s=>setWatchlist(old=>old.includes(s)?old.filter(x=>x!==s):[...old,s]);
  const trade=s=>{setSymbol(s);go('Orders');setNotice('Demo ticket only. No real order will be sent.');};
  const submitDemo=e=>{
    e.preventDefault();
    const n=Number(qty);
    if(!Number.isInteger(n)||n<1){setNotice('Quantity must be a whole number greater than zero.');return;}
    const q=quotes.find(x=>x.symbol===symbol);
    if(!q){setNotice('Please select a valid symbol.');return;}
    const order={id:Date.now(),side,symbol,qty:n,type:orderType,price:q.price,status:'DEMO ONLY',time:new Date().toLocaleString()};
    setOrders(old=>[order,...old]);
    setNotice('Demo order saved on this device only. No broker order or money movement occurred.');
  };
  const nav=['Overview','Markets','Watchlist','Portfolio','Orders','Wallet','Deposit','Withdraw','Profile'];
  return <div className="app-shell">
    <aside className={'sidebar '+(menuOpen?'show':'')}>
      <div className="brand"><div className="brand-mark">B</div><span>Bharat<span className="brand-light">Trade</span></span><button className="icon-btn mobile-close" onClick={()=>setMenuOpen(false)}><X size={18}/></button></div>
      <div className="workspace-label">TRADING WORKSPACE</div>
      {nav.map((n,i)=><button key={n} onClick={()=>go(n)} className={'nav-item '+(active===n?'selected':'')}>{[<LayoutDashboard/>,<LineChart/>,<Activity/>,<Wallet/>,<ArrowUpRight/>,<Wallet/>,<ArrowUpRight/>,<ArrowUpRight/>,<Activity/>][i]}<span>{n}</span></button>)}
      <div className="sidebar-bottom"><div className="secure-card"><ShieldCheck size={20}/><b>Security first</b><p>Broker credentials belong on the backend, never in the browser.</p></div><div className="user-row"><div className="avatar">BT</div><div><b>Trader account</b><small>Broker not connected</small></div><ChevronDown size={16}/></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><button className="icon-btn menu-toggle" onClick={()=>setMenuOpen(true)}><Menu/></button><div className="crumb">Workspace <span>/</span> <b>{active}</b></div><div className="top-actions"><span className="api-status"><i className={apiState==='Backend connected'?'green-dot':'amber-dot'}></i>{apiState}</span><button className="icon-btn" aria-label="Help" onClick={()=>setNotice('Prices may be illustrative. This dashboard is not financial advice.')}><CircleHelp/></button><button className="icon-btn" aria-label="Notifications" onClick={()=>setNotice('No new notifications.')}><Bell/></button><div className="avatar">R</div></div></header>
      <div className="content">
        <div className="welcome"><div><p className="eyebrow">BHARATTRADE WORKSPACE</p><h1>{active==='Overview'?'Market overview':active}</h1><p className="muted">Track instruments and manage your trading workspace.</p></div><div className="market-state"><span className="state-dot"></span>{status}<button className="plain-icon" title="Refresh market data" onClick={refreshQuotes} disabled={loading}><RefreshCw size={15}/></button></div></div>
        <div className="notice"><ShieldCheck size={19}/><div><b>Real trading is disabled</b><p>Broker authorization and a tested broker adapter are required before sending live orders. Orders on this page are demo records only.</p></div></div>
        {notice&&<div className="inline-notice" role="status"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss message"><X size={16}/></button></div>}
        {active==='Overview'&&<><section className="metrics">
          <div className="metric-card"><div className="metric-head">Account value <button className="plain-icon" onClick={()=>setShowBalance(!showBalance)}>{showBalance?<Eye size={17}/>:<EyeOff size={17}/>}</button></div><h2>{showBalance?'₹—':'••••••'}</h2><div className="metric-foot"><span className="neutral-pill">Broker not connected</span></div></div>
          <div className="metric-card"><div className="metric-head">Day's P&amp;L</div><h2>₹—</h2><div className="metric-foot muted">Needs broker connection</div></div>
          <div className="metric-card"><div className="metric-head">Invested value</div><h2>₹—</h2><div className="metric-foot muted">No portfolio synced</div></div>
          <div className="metric-card"><div className="metric-head">Demo orders</div><h2>{orders.length}</h2><div className="metric-foot muted">Local records only</div></div>
        </section><section className="market-panel"><div className="panel-header"><div><h3>Market watch</h3><p className="muted">Search symbols, save a watchlist, or open a demo ticket</p></div><div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search symbol"/></div></div><QuoteTable quotes={visible} watchlist={watchlist} toggleWatch={toggleWatch} trade={trade}/><div className="panel-foot"><span className="muted">{updated?'Updated '+updated+' · ':''}Values may be illustrative until a provider is configured.</span><button className="text-btn" onClick={()=>go('Markets')}>View markets <ArrowUpRight size={15}/></button></div></section><section className="bottom-grid"><div className="market-panel compact"><div className="panel-header"><div><h3>Portfolio</h3><p className="muted">Holdings overview</p></div></div><div className="empty-state"><div className="empty-graphic"><Wallet size={25}/></div><b>Connect a broker to sync holdings</b><p>Real balances and holdings appear after backend broker authorization is implemented.</p><button className="text-btn centered-btn" onClick={()=>go('Portfolio')}>Open portfolio <ArrowUpRight size={15}/></button></div></div><div className="market-panel compact"><div className="panel-header"><div><h3>Recent demo orders</h3><p className="muted">Saved on this device</p></div></div><div className="empty-state"><div className="empty-graphic"><Activity size={25}/></div><b>{orders.length?orders.length+' demo order(s)':'No demo orders yet'}</b><p>Open Orders to create a local demo record. Nothing is sent to a broker.</p><button className="text-btn centered-btn" onClick={()=>go('Orders')}>Open orders <ArrowUpRight size={15}/></button></div></div></section></>}
        {active==='Markets'&&<section className="market-panel"><div className="panel-header"><div><h3>Markets</h3><p className="muted">Search symbols, save to watchlist or open a demo ticket</p></div><div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search symbol"/></div></div><QuoteTable quotes={visible} watchlist={watchlist} toggleWatch={toggleWatch} trade={trade}/><div className="panel-foot"><span className="muted">Source: {status}</span><button className="text-btn" onClick={refreshQuotes} disabled={loading}><RefreshCw size={15}/> Refresh</button></div></section>}
        {active==='Watchlist'&&<section className="market-panel"><div className="panel-header"><div><h3>Your watchlist</h3><p className="muted">Saved on this device. Tap the star to remove a symbol.</p></div><div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search watchlist"/></div></div><QuoteTable quotes={visible} watchlist={watchlist} toggleWatch={toggleWatch} trade={trade}/>{visible.length===0&&<div className="empty-state"><b>Watchlist is empty</b><p>Go to Markets and tap a star to add instruments.</p><button className="text-btn centered-btn" onClick={()=>go('Markets')}>Browse markets <ArrowUpRight size={15}/></button></div>}</section>}
        {active==='Portfolio'&&<section className="market-panel"><div className="panel-header"><div><h3>Portfolio</h3><p className="muted">Broker holdings and performance</p></div><Wallet size={19}/></div><div className="empty-state large-empty"><div className="empty-graphic"><Wallet size={25}/></div><b>Broker connection required</b><p>No real holdings are available yet. A broker integration and authenticated portfolio API are needed to show positions, average price and P&amp;L.</p><button className="text-btn centered-btn" onClick={()=>setNotice('Do not enter broker passwords or API secrets on this page. Broker authorization must be implemented securely on the backend.')}>Connection information <CircleHelp size={15}/></button></div></section>}
        {active==='Orders'&&<div className="orders-layout"><section className="market-panel"><div className="panel-header"><div><h3>Demo order ticket</h3><p className="muted">Local preview only — no real order submitted</p></div><span className="neutral-pill">DEMO ONLY</span></div><form className="order-form" onSubmit={submitDemo}><label>Side</label><div className="side-toggle"><button type="button" className={side==='Buy'?'buy-active':''} onClick={()=>setSide('Buy')}>Buy</button><button type="button" className={side==='Sell'?'sell-active':''} onClick={()=>setSide('Sell')}>Sell</button></div><label htmlFor="instrument">Instrument</label><select id="instrument" value={symbol} onChange={e=>setSymbol(e.target.value)}>{quotes.map(q=><option key={q.symbol} value={q.symbol}>{q.symbol+' — '+q.name}</option>)}</select><label htmlFor="quantity">Quantity</label><input id="quantity" type="number" min="1" step="1" value={qty} onChange={e=>setQty(e.target.value)} required/><label htmlFor="ordertype">Order type</label><select id="ordertype" value={orderType} onChange={e=>setOrderType(e.target.value)}><option>Market</option><option>Limit (illustrative)</option></select><div className="order-preview"><span>Indicative sample price</span><b>{money((quotes.find(q=>q.symbol===symbol)||{}).price)}</b><small>May not be live or executable.</small></div><button className="primary-btn" type="submit">Save demo order</button><p className="form-disclaimer">This creates a local demo record only. It does not place trades or move funds.</p></form></section><section className="market-panel"><div className="panel-header"><div><h3>Order history</h3><p className="muted">Demo records on this device</p></div><button className="text-btn" onClick={()=>{setOrders([]);setNotice('Local demo order history cleared.');}}>Clear history</button></div>{orders.length===0?<div className="empty-state"><div className="empty-graphic"><Activity size={25}/></div><b>No orders recorded</b><p>Use the demo ticket to try the interaction.</p></div>:<div className="table-wrap"><table><thead><tr><th>Side / Symbol</th><th>Qty</th><th>Price</th><th>Status</th><th>Time</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><b className={o.side==='Buy'?'text-buy':'text-sell'}>{o.side}</b><small className="block-small">{o.symbol}</small></td><td>{o.qty}</td><td>{money(o.price)}</td><td><span className="neutral-pill">{o.status}</span></td><td>{o.time}</td></tr>)}</tbody></table></div>}</section></div>}

        {active==='Wallet'&&<section className="wallet-grid"><div className="metric-card"><div className="metric-head">Available balance</div><h2>₹—</h2><span className="neutral-pill">Real account not connected</span><p className="muted">A verified backend wallet is required to show a real balance.</p><button className="primary-btn" onClick={()=>go('Deposit')}>Add money</button> <button className="secondary-btn" onClick={()=>go('Withdraw')}>Withdraw</button></div><div className="market-panel"><div className="panel-header"><div><h3>Wallet activity</h3><p className="muted">Local demo requests only</p></div></div>{fundRequests.length===0?<div className="empty-state"><b>No requests yet</b><p>Payment processing is not connected; no money can move.</p></div>:<div className="table-wrap"><table><thead><tr><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{fundRequests.map(x=><tr key={x.id}><td>{x.type}</td><td>{money(x.amount)}</td><td>LOCAL DEMO</td><td>{x.time}</td></tr>)}</tbody></table></div>}</div></section>}
        {(active==='Deposit'||active==='Withdraw')&&<section className="market-panel funds-panel"><div className="panel-header"><div><h3>{active==='Deposit'?'Add money':'Withdraw funds'}</h3><p className="muted">Demo request form</p></div><span className="neutral-pill">NOT LIVE</span></div><div className="fund-warning"><b>Important: submitting only saves a local demo request. No payment or transfer occurs.</b></div><form className="order-form" onSubmit={e=>{e.preventDefault();const n=Number(fundAmount);if(!Number.isFinite(n)||n<1){setNotice('Enter a valid amount greater than zero.');return;}setFundRequests(old=>[{id:Date.now(),type:active,amount:n,time:new Date().toLocaleString()},...old]);setFundAmount('');setNotice('Demo request saved locally. No money was moved.');go('Wallet');}}><label htmlFor="fund-amount">Amount (INR)</label><input id="fund-amount" type="number" min="1" step="1" value={fundAmount} onChange={e=>setFundAmount(e.target.value)} required/><button className="primary-btn" type="submit">Save demo request</button><p className="form-disclaimer">Real deposits/withdrawals require a payment provider and secure backend integration.</p></form></section>}
        {active==='Profile'&&<section className="market-panel profile-panel"><div className="panel-header"><div><h3>Profile settings</h3><p className="muted">Saved on this device</p></div><div className="avatar">{(profile.name||'T').slice(0,1).toUpperCase()}</div></div><form className="order-form" onSubmit={e=>{e.preventDefault();try{localStorage.setItem('bt-profile',JSON.stringify(profile));setNotice('Profile saved on this device.');}catch{setNotice('Could not save profile.');}}}><label htmlFor="profile-name">Display name</label><input id="profile-name" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} required/><label htmlFor="profile-email">Email</label><input id="profile-email" type="email" value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})} placeholder="you@example.com"/><label htmlFor="profile-phone">Phone</label><input id="profile-phone" value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})} placeholder="Phone number"/><button className="primary-btn" type="submit">Save profile</button><p className="form-disclaimer">This is not a login or verified account. Profile data is stored in this browser only.</p></form></section>}
        <footer><span>© 2026 BharatTrade</span><span><ShieldCheck size={14}/> Secure by design</span><span className="footer-disclaimer">Trading involves risk. This starter is not investment advice.</span></footer>
      </div>
    </main>
  </div>;
}
function QuoteTable({quotes,watchlist,toggleWatch,trade}){
  return <div className="table-wrap"><table><thead><tr><th>Instrument</th><th>Last price</th><th>Change</th><th>Trend</th><th>Watch</th><th>Action</th></tr></thead><tbody>{quotes.map((q,i)=><tr key={q.symbol}><td><div className="instrument"><div className="symbol-icon">{q.symbol.slice(0,1)}</div><div><b>{q.name}</b><small>{q.symbol}</small></div></div></td><td className="price">{money(q.price)}</td><td><span className={'change '+(q.change>=0?'positive':'negative')}>{q.change>=0?'+':''}{q.change.toFixed(2)}%</span></td><td><Sparkline positive={q.change>=0} seed={i}/></td><td><button className={'watch-btn '+(watchlist.includes(q.symbol)?'watching':'')} onClick={()=>toggleWatch(q.symbol)} aria-label={watchlist.includes(q.symbol)?'Remove from watchlist':'Add to watchlist'} title={watchlist.includes(q.symbol)?'Remove from watchlist':'Add to watchlist'}><Star size={17} fill={watchlist.includes(q.symbol)?'currentColor':'none'}/></button></td><td><button className="small-action" onClick={()=>trade(q.symbol)}>Demo trade</button></td></tr>)}</tbody></table>{quotes.length===0&&<div className="empty">No matching instruments.</div>}</div>;
}
function Sparkline({positive,seed}){const vals=Array.from({length:18},(_,i)=>35+Math.sin(i*.8+seed)*12+Math.cos(i*.34+seed)*9+(positive?i*.6:-i*.5));const points=vals.map((v,i)=>i*5+','+(35-v)).join(' ');return <svg className="sparkline" viewBox="0 0 85 40" role="img" aria-label={positive?'Upward trend illustration':'Downward trend illustration'}><polyline points={points} fill="none" stroke={positive?'#0b9b72':'#e45d67'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
export default App;
