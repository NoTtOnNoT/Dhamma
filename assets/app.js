'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const normalize = value => String(value).normalize('NFC').toLocaleLowerCase('th').replace(/[๐-๙]/g,d=>String('๐๑๒๓๔๕๖๗๘๙'.indexOf(d))).replace(/[\s\-–—.\u200B-\u200D\uFEFF]/g,'');
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data = window.EXAM_DATA;
  if (!data || !Array.isArray(data.records)) {
    $('results-section').hidden=false;$('summary').textContent='โหลดรายชื่อไม่สำเร็จ';
    $('query').disabled=true;return;
  }
  const records = data.records.map(r=>({...r,nameIndex:normalize(r.firstName+r.lastName),idIndex:normalize(r.number)}));
  const pageSize=10;
  let matches=[],page=1;
  let visibleKeys=new Set();
  function render() {
    $('results-section').hidden=false;
    $('summary').textContent=matches.length?`พบ ${matches.length.toLocaleString('th-TH')} รายชื่อ`:'ไม่พบรายชื่อ';
    const pages=Math.max(1,Math.ceil(matches.length/pageSize));
    page=Math.max(1,Math.min(page,pages));
    const pageRecords=matches.slice((page-1)*pageSize,page*pageSize);
    $('results').innerHTML=matches.length?'<div class="cards">'+pageRecords.map((r,i)=>`<article class="result-card" data-enter="${!visibleKeys.has(r.level+r.number)}" style="--delay:${i*22}ms"><div class="card-heading"><h2>${escape(r.firstName)} ${escape(r.lastName)}</h2><span class="level">ชั้น${escape(r.level)}</span></div><div class="detail-grid"><div class="exam-number detail-frame"><span>เลขที่สอบ</span><strong>${escape(r.number)}</strong></div><div class="exam-group detail-frame"><span>ห้องสอบที่</span><strong>${escape(r.room)}</strong></div><div class="room detail-frame"><span>หมายเลขห้อง</span><strong>${escape(r.classroom || '—')}</strong></div></div></article>`).join('')+'</div>':'<p class="empty">ลองตรวจการสะกดอีกครั้ง</p>';
    visibleKeys=new Set(pageRecords.map(r=>r.level+r.number));
    $('pagination').hidden=pages===1;
    $('prev').disabled=page===1;$('next').disabled=page===pages;
    $('page-label').textContent=`${page} / ${pages}`;
  }
  function reset() {
    visibleKeys.clear();matches=[];page=1;$('summary').textContent='';$('results').innerHTML='';$('results-section').hidden=true;$('pagination').hidden=true;
  }
  function search() {
    const query=$('query').value.trim();
    // Match both names together, with spaces, without spaces, or separated by a hyphen.
    const parts=query.split(/[\s\-–—]+/).map(normalize).filter(Boolean);
    if(!parts.length){reset();return;}
    matches=records.filter(r=>parts.every(p=>r.nameIndex.includes(p)||r.idIndex.includes(p)));
    page=1;render();

  }
  $('search-form').addEventListener('submit',e=>{e.preventDefault();search();});
  $('query').addEventListener('input',()=>{
    $('clear-query').hidden=!$('query').value;
    search();
  });
  $('clear-query').onclick=()=>{$('query').value='';$('clear-query').hidden=true;reset();$('query').focus();};
  function turn(delta){page+=delta;render();$('results-section').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
  $('prev').onclick=()=>turn(-1);$('next').onclick=()=>turn(1);
})();
