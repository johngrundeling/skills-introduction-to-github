#!/usr/bin/env python3
"""Generate the BioKissed SA storefront funnel (index.html) from the trusted catalog.
Shop -> cart -> checkout -> POST /api/pay -> Paystack hosted checkout. The Paystack
public key is never needed client-side (the server initializes and returns the URL)."""
import json, os, base64, html, csv

ROOT = os.path.dirname(os.path.abspath(__file__))
MASTER = os.path.join(ROOT, "..", "biokissed", "biokissed-products.csv")
BRANCH = "claude/catalog-product-codes-kkncc3"
WEB = f"https://raw.githubusercontent.com/johngrundeling/skills-introduction-to-github/refs/heads/{BRANCH}/biokissed/images"
FEE_SKUS = {"DLL", "DLN", "ICE", "TBG"}

def build_catalog():
    products, fees = {}, {}
    for r in csv.DictReader(open(MASTER)):
        sku = r["SKU"].strip()
        try: price = float(r["Price"])
        except ValueError: price = 0.0
        rec = {"name": r["Product Name"].strip(), "price": round(price, 2),
               "cat": r["Category"], "img": f"{WEB}/{sku}.png", "desc": r["Description"]}
        (fees if sku in FEE_SKUS else products)[sku] = rec
    oos = [s for s, p in products.items() if p["price"] <= 0 and s != "BAC"]
    catalog = {"products": products, "fees": fees, "oos": oos, "currency": "ZAR"}
    with open(os.path.join(ROOT, "functions/_catalog.js"), "w") as f:
        f.write("// AUTO-GENERATED trusted catalog — the server computes order totals from THIS, never the client.\n")
        f.write("export const CATALOG = " + json.dumps(catalog, ensure_ascii=False) + ";\n")
    json.dump(catalog, open(os.path.join(ROOT, "_catalog.json"), "w"), ensure_ascii=False)
    return catalog

cat = build_catalog()
logo_b64 = base64.b64encode(open(os.path.join(ROOT, "assets/logo_lockup_teal.png"), "rb").read()).decode()

DATA_JS = "const CATALOG = " + json.dumps(cat, ensure_ascii=False) + ";"

PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BioKissed SA — Shop</title><style>
@font-face{font-family:Montserrat;src:url("assets/Montserrat-Regular.ttf");font-weight:400}
@font-face{font-family:Montserrat;src:url("assets/Montserrat-Medium.ttf");font-weight:500}
@font-face{font-family:Montserrat;src:url("assets/Montserrat-SemiBold.ttf");font-weight:600}
@font-face{font-family:Montserrat;src:url("assets/Montserrat-Bold.ttf");font-weight:700}
*{box-sizing:border-box}
:root{--bg:#f4f7f8;--card:#fff;--ink:#1a2a49;--mut:#6e7a84;--acc:#5e7e92;--acc2:#9f6652;--line:#e2e9ec}
body{margin:0;font:16px/1.55 Montserrat,system-ui,sans-serif;background:var(--bg);color:var(--ink)}
header{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid var(--line);
 display:flex;align-items:center;justify-content:space-between;padding:14px 20px;gap:12px}
header img{height:40px}
.hd-r{display:flex;align-items:center;gap:14px}
.tag{color:var(--acc);font-size:12px;letter-spacing:.06em}
.cartbtn{position:relative;background:var(--acc);color:#fff;border:0;border-radius:10px;
 font:600 14px Montserrat;padding:9px 16px;cursor:pointer}
.cartbtn .n{position:absolute;top:-8px;right:-8px;background:var(--acc2);color:#fff;border-radius:20px;
 min-width:20px;height:20px;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0 5px}
main{max-width:1180px;margin:0 auto;padding:20px}
.hero{text-align:center;padding:22px 10px 6px}
.hero h1{font-size:24px;margin:0 0 6px}.hero p{color:var(--mut);margin:0;font-size:14px}
h2{font-size:18px;font-weight:700;border-left:4px solid var(--acc2);padding-left:12px;margin:30px 0 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;display:flex;flex-direction:column}
.thumb{aspect-ratio:1/1.15;border-radius:10px;overflow:hidden;background:#f0f4f5;position:relative}
.thumb img{width:100%;height:100%;object-fit:contain}
.sku{position:absolute;top:8px;left:8px;background:var(--acc);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px}
.card h3{font-size:15px;font-weight:700;margin:10px 2px 4px}
.desc{color:var(--mut);font-size:12px;margin:0 2px 12px;flex:1}
.row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.price{font-weight:700;font-size:16px;color:var(--acc)}
.poa{color:var(--mut);font-size:13px;font-weight:600}
.add{background:var(--acc);color:#fff;border:0;border-radius:9px;font:700 13px Montserrat;padding:8px 12px;cursor:pointer}
.add:hover{filter:brightness(1.07)}
.add:disabled{background:#c3cdd3;cursor:not-allowed}
/* cart drawer */
.overlay{position:fixed;inset:0;background:#0a1a2a55;opacity:0;pointer-events:none;transition:.2s;z-index:30}
.overlay.on{opacity:1;pointer-events:auto}
.drawer{position:fixed;top:0;right:0;height:100%;width:min(420px,100%);background:#fff;z-index:40;
 transform:translateX(100%);transition:.25s;display:flex;flex-direction:column;box-shadow:-8px 0 30px #1a2a4922}
.drawer.on{transform:none}
.drawer h3{margin:0;padding:18px 20px;border-bottom:1px solid var(--line);font-size:18px;display:flex;justify-content:space-between;align-items:center}
.x{background:0;border:0;font-size:22px;cursor:pointer;color:var(--mut)}
.items{flex:1;overflow:auto;padding:8px 20px}
.li{display:flex;gap:10px;padding:12px 0;border-bottom:1px solid var(--line)}
.li img{width:52px;height:62px;object-fit:contain;background:#f0f4f5;border-radius:8px}
.li .nm{font-size:13px;font-weight:600;flex:1}
.li .pr{font-size:13px;color:var(--acc);font-weight:700}
.qty{display:flex;align-items:center;gap:6px;margin-top:4px}
.qty button{width:24px;height:24px;border:1px solid var(--line);background:#fff;border-radius:6px;cursor:pointer;font-weight:700}
.rm{background:0;border:0;color:var(--acc2);font-size:12px;cursor:pointer;margin-top:4px}
.foot{border-top:1px solid var(--line);padding:16px 20px}
.foot .tot{display:flex;justify-content:space-between;font-weight:700;font-size:17px;margin-bottom:12px}
.cta{width:100%;background:var(--acc);color:#fff;border:0;border-radius:10px;font:700 15px Montserrat;padding:13px;cursor:pointer}
.cta:hover{filter:brightness(1.07)}.cta:disabled{background:#c3cdd3;cursor:not-allowed}
label{font-size:13px;font-weight:600;display:block;margin:10px 0 4px}
input,select{width:100%;padding:10px;border:1px solid var(--line);border-radius:9px;font:15px Montserrat}
.optrow{display:flex;gap:8px;align-items:center;margin:6px 0;font-size:13px;font-weight:500}
.optrow input{width:auto}
.empty{color:var(--mut);text-align:center;padding:40px 0;font-size:14px}
.err{background:#fdecec;color:#b23;border-radius:9px;padding:10px;font-size:13px;margin-top:8px;display:none}
footer{max-width:1180px;margin:0 auto;padding:26px 20px;color:var(--mut);font-size:12px;border-top:1px solid var(--line)}
.step{font-size:12px;color:var(--mut);margin:2px 0 10px}
</style></head><body>
<header>
 <img src="data:image/png;base64,__LOGO__" alt="BioKissed SA">
 <div class="hd-r"><span class="tag">loving nature</span>
 <button class="cartbtn" onclick="openCart()">Cart <span class="n" id="cnt">0</span></button></div>
</header>
<main>
 <div class="hero"><h1>BioKissed SA — Research Compound Shop</h1>
 <p>All products supplied strictly for laboratory & research use. Prices in ZAR.</p></div>
 <div id="shop"></div>
</main>
<footer><strong>BioKissed SA</strong> — Research Use Only. Prices in ZAR, reconstituted (pen), exclude courier delivery.
 Secure payment by Paystack. Subject to change without notice.</footer>

<div class="overlay" id="ov" onclick="closeCart()"></div>
<aside class="drawer" id="drawer" aria-label="Cart">
 <h3><span id="dtitle">Your Cart</span><button class="x" onclick="closeCart()">&times;</button></h3>
 <div class="items" id="cartbody"></div>
 <div class="foot" id="cartfoot"></div>
</aside>

<script>
__DATA__
const fmt=n=>"R"+n.toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2});
let cart=JSON.parse(localStorage.getItem("bk_cart")||"{}");
const save=()=>localStorage.setItem("bk_cart",JSON.stringify(cart));

// ---- render shop grouped by category (file order) ----
function renderShop(){
 const cats=[]; const map={};
 for(const [sku,p] of Object.entries(CATALOG.products)){ if(!map[p.cat]){map[p.cat]=[];cats.push(p.cat);} map[p.cat].push([sku,p]); }
 const el=document.getElementById("shop"); el.innerHTML="";
 for(const c of cats){
  const sec=document.createElement("section");
  let h='<h2>'+c+'</h2><div class="grid">';
  for(const [sku,p] of map[c]){
   const oos=CATALOG.oos.includes(sku)||p.price<=0&&sku!=="BAC";
   const free=sku==="BAC";
   const priceHtml = oos ? '<span class="poa">POA</span>' : (free?'<span class="price">Free</span>':'<span class="price">'+fmt(p.price)+'</span>');
   const btn = oos ? '<button class="add" disabled>Sold out</button>'
                   : '<button class="add" onclick="addToCart(\\''+sku+'\\')">Add</button>';
   h+='<article class="card"><div class="thumb"><img loading="lazy" src="'+p.img+'" alt="'+esc(p.name)+'"><span class="sku">'+sku+'</span></div>'
    +'<h3>'+esc(p.name)+'</h3><p class="desc">'+esc(p.desc.slice(0,120))+(p.desc.length>120?"…":"")+'</p>'
    +'<div class="row">'+priceHtml+btn+'</div></article>';
  }
  h+='</div>'; sec.innerHTML=h; el.appendChild(sec);
 }
}
function esc(s){return (s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function addToCart(sku){ cart[sku]=(cart[sku]||0)+1; save(); updateCount(); openCart(); }
function setQty(sku,q){ q=Math.max(0,Math.min(99,q)); if(q===0)delete cart[sku]; else cart[sku]=q; save(); updateCount(); renderCart(); }
function updateCount(){ document.getElementById("cnt").textContent=Object.values(cart).reduce((a,b)=>a+b,0); }

let checkout=false;
function openCart(){ checkout=false; renderCart(); document.getElementById("ov").classList.add("on"); document.getElementById("drawer").classList.add("on"); }
function closeCart(){ document.getElementById("ov").classList.remove("on"); document.getElementById("drawer").classList.remove("on"); }

function cartLines(){ return Object.entries(cart).map(([sku,qty])=>({sku,qty,p:CATALOG.products[sku]})).filter(x=>x.p); }
function subtotal(){ return cartLines().reduce((s,x)=>s+x.p.price*x.qty,0); }

function renderCart(){
 const body=document.getElementById("cartbody"), foot=document.getElementById("cartfoot");
 const lines=cartLines();
 document.getElementById("dtitle").textContent = checkout?"Checkout":"Your Cart";
 if(lines.length===0){ body.innerHTML='<div class="empty">Your cart is empty.</div>'; foot.innerHTML=""; return; }
 if(!checkout){
  body.innerHTML=lines.map(x=>'<div class="li"><img src="'+x.p.img+'"><div class="nm">'+esc(x.p.name)
   +'<div class="qty"><button onclick="setQty(\\''+x.sku+'\\','+(x.qty-1)+')">−</button><span>'+x.qty
   +'</span><button onclick="setQty(\\''+x.sku+'\\','+(x.qty+1)+')">+</button></div>'
   +'<button class="rm" onclick="setQty(\\''+x.sku+'\\',0)">remove</button></div>'
   +'<div class="pr">'+fmt(x.p.price*x.qty)+'</div></div>').join("");
  foot.innerHTML='<div class="tot"><span>Subtotal</span><span>'+fmt(subtotal())+'</span></div>'
   +'<button class="cta" onclick="goCheckout()">Checkout</button>';
 } else { renderCheckout(body,foot); }
}
function goCheckout(){ checkout=true; renderCart(); }

function renderCheckout(body,foot){
 const feeD=CATALOG.fees, dLoc=feeD.DLL, dNat=feeD.DLN, ice=feeD.ICE, tbg=feeD.TBG;
 body.innerHTML=
  '<div class="step">1. Your details</div>'
  +'<label>Full name</label><input id="f_name" autocomplete="name">'
  +'<label>Email (receipt & order)</label><input id="f_email" type="email" autocomplete="email">'
  +'<label>Phone</label><input id="f_phone" autocomplete="tel">'
  +'<label>Delivery address</label><input id="f_addr" autocomplete="street-address">'
  +'<label>City / town</label><input id="f_city" autocomplete="address-level2">'
  +'<div class="step" style="margin-top:14px">2. Delivery</div>'
  +'<label class="optrow"><input type="radio" name="del" value="DLL" checked onchange="renderTotals()"> '+dLoc.name+' — '+fmt(dLoc.price)+'</label>'
  +'<label class="optrow"><input type="radio" name="del" value="DLN" onchange="renderTotals()"> '+dNat.name+' — '+fmt(dNat.price)+'</label>'
  +'<div class="step" style="margin-top:14px">3. Cold-chain (optional)</div>'
  +'<label class="optrow"><input type="checkbox" id="a_ICE" onchange="renderTotals()"> '+ice.name+' — '+fmt(ice.price)+'</label>'
  +'<label class="optrow"><input type="checkbox" id="a_TBG" onchange="renderTotals()"> '+tbg.name+' — '+fmt(tbg.price)+'</label>'
  +'<div class="err" id="err"></div>';
 foot.innerHTML='<div id="totals"></div>'
  +'<button class="cta" id="paybtn" onclick="pay()">Pay with Paystack</button>'
  +'<button class="rm" style="display:block;margin:8px auto 0" onclick="openCart()">← back to cart</button>';
 renderTotals();
}
function selectedDelivery(){ const r=document.querySelector('input[name=del]:checked'); return r?r.value:"DLL"; }
function selectedAddons(){ return ["ICE","TBG"].filter(a=>document.getElementById("a_"+a)?.checked); }
function orderTotal(){
 let t=subtotal(); const d=CATALOG.fees[selectedDelivery()]; if(d)t+=d.price;
 selectedAddons().forEach(a=>t+=CATALOG.fees[a].price); return t;
}
function renderTotals(){
 const d=CATALOG.fees[selectedDelivery()];
 let rows='<div class="tot" style="font-weight:500;font-size:14px"><span>Subtotal</span><span>'+fmt(subtotal())+'</span></div>';
 rows+='<div class="tot" style="font-weight:500;font-size:14px"><span>'+d.name+'</span><span>'+fmt(d.price)+'</span></div>';
 selectedAddons().forEach(a=>{const f=CATALOG.fees[a];rows+='<div class="tot" style="font-weight:500;font-size:14px"><span>'+f.name+'</span><span>'+fmt(f.price)+'</span></div>';});
 rows+='<div class="tot"><span>Total</span><span>'+fmt(orderTotal())+'</span></div>';
 document.getElementById("totals").innerHTML=rows;
}
async function pay(){
 const err=document.getElementById("err"); err.style.display="none";
 const customer={name:v("f_name"),email:v("f_email"),phone:v("f_phone"),address:v("f_addr"),city:v("f_city")};
 if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(customer.email)){ return showErr("Please enter a valid email address."); }
 if(!customer.name||!customer.address){ return showErr("Please enter your name and delivery address."); }
 const items=cartLines().map(x=>({sku:x.sku,qty:x.qty}));
 if(items.length===0) return showErr("Your cart is empty.");
 const btn=document.getElementById("paybtn"); btn.disabled=true; btn.textContent="Starting secure payment…";
 try{
  const r=await fetch("/api/pay",{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({items,customer,delivery:selectedDelivery(),addons:selectedAddons()})});
  const data=await r.json();
  if(!r.ok||!data.authorization_url){ throw new Error(data.error||"Could not start payment."); }
  window.location.href=data.authorization_url;
 }catch(e){ btn.disabled=false; btn.textContent="Pay with Paystack"; showErr(e.message); }
}
function v(id){return (document.getElementById(id)?.value||"").trim();}
function showErr(m){const e=document.getElementById("err");e.textContent=m;e.style.display="block";}

renderShop(); updateCount();
</script>
</body></html>"""

out = PAGE.replace("__LOGO__", logo_b64).replace("__DATA__", DATA_JS)
open(os.path.join(ROOT, "index.html"), "w").write(out)
print("wrote index.html", len(out), "bytes")
