window.AtmosSatCharts = (() => {
  let chart;
  const makeLabels = (count, rangeMinutes) => {
    const now = Date.now();
    return Array.from({length: count}, (_, i) => {
      const t = new Date(now - (count - 1 - i) * rangeMinutes * 60000 / count);
      return rangeMinutes <= 30
        ? t.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit", second:"2-digit"})
        : t.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"});
    });
  };
  function init() {
    const canvas = document.getElementById("historyChart");
    if (!canvas || !window.Chart) return;
    const labels = makeLabels(12, 30);
    chart = new Chart(canvas, {
      type: "line",
      data: { labels, datasets: [
        {label:"Temperatura (°C)", data:[24.3,24.8,24.5,25.1,25.4,25.2,26.1,26.3,26.1,26.5,26.4,26.8], borderColor:"#4c91ff", backgroundColor:"rgba(76,145,255,.08)", borderWidth:2, tension:.38, pointRadius:0, pointHoverRadius:4, fill:true, yAxisID:"y"},
        {label:"Umidade (%)", data:[70,69,71,68,67,68,66,65,66,64,65,64], borderColor:"#4ce1ee", borderWidth:2, tension:.38, pointRadius:0, pointHoverRadius:4, fill:false, yAxisID:"y1"}
      ]},
      options: {
        responsive:true, maintainAspectRatio:false, interaction:{mode:"index",intersect:false},
        plugins:{legend:{display:false},tooltip:{backgroundColor:"#071426",titleColor:"#edf5ff",bodyColor:"#c3d6ed",padding:11,displayColors:true}},
        scales:{
          x:{grid:{display:false},ticks:{color:"#8194ad",maxTicksLimit:6,font:{size:9}},border:{display:false}},
          y:{position:"left",min:10,max:40,grid:{color:"rgba(129,148,173,.10)"},ticks:{color:"#8194ad",font:{size:9},maxTicksLimit:5},border:{display:false}},
          y1:{position:"right",min:0,max:100,grid:{drawOnChartArea:false},ticks:{color:"#8194ad",font:{size:9},maxTicksLimit:5},border:{display:false}}
        }
      }
    });
  }
  function update(temp, humidity, range=30) {
    if (!chart) return;
    const count = 12;
    chart.data.labels = makeLabels(count, range);
    chart.data.datasets[0].data = Array.from({length:count},(_,i)=>Number((temp + Math.sin(i*.85)*1.5 + (i-count/2)*.06).toFixed(1)));
    chart.data.datasets[1].data = Array.from({length:count}, (_, i) => { const value = Number((humidity + Math.cos(i * .7) * 4 - (i - count / 2) * .25).toFixed(1)); return Math.max(0, Math.min(100, value)); });
    chart.update("none");
  }
  function setRange(range) {
    if (!chart) return;
    chart.data.labels = makeLabels(12, range);
    chart.update("none");
  }
  return {init, update, setRange};
})();