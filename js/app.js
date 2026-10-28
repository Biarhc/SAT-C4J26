(() => {
  const $ = id => document.getElementById(id);
  const state = {demo:true, endpoint:"", refreshMs:5000, timer:null, lastData:null, range:30};
  const demoData = () => {
    const t = Date.now()/1000;
    return {
      temperature_c: +(26.8 + Math.sin(t/24)*1.2 + (Math.random()-.5)*.25).toFixed(1),
      humidity_percent: +(64 + Math.sin(t/32)*5 + (Math.random()-.5)*1.2).toFixed(1),
      pressure_hpa: +(1013.2 + Math.sin(t/90)*1.7).toFixed(1),
      air_quality:{value:18,unit:"µg/m³",sensor:"PM2.5 (demonstração)"},
      rain_probability_percent:35,
      rain_source:"Dado ilustrativo",
      timestamp:new Date().toISOString()
    };
  };
  function setStatus(mode, text) {
    $("connectionText").textContent = text;
    $("deviceConnection").textContent = text;
    $("statusDot").classList.toggle("disconnected", mode === "disconnected");
    $("modeLabel").textContent = mode === "connected" ? "ESP32 CONECTADO" : mode === "connecting" ? "CONECTANDO" : "DEMO AO VIVO";
    $("sourceLabel").textContent = mode === "connected" ? "Dados recebidos do endpoint configurado" : mode === "disconnected" ? "Sem conexão com a estação" : "Dados simulados para demonstração";
    $("intervalText").textContent = mode === "connected" ? `${state.refreshMs/1000} segundos` : "5 segundos (simulado)";
  }
  function format(value, digits=1) { return value == null || !Number.isFinite(Number(value)) ? "—" : Number(value).toLocaleString("pt-BR",{minimumFractionDigits:digits,maximumFractionDigits:digits}); }
  function render(data) {
    state.lastData = data;
    const temp = Number(data.temperature_c ?? data.temperature);
    const humidity = Number(data.humidity_percent ?? data.humidity);
    const pressure = Number(data.pressure_hpa ?? data.pressure);
    const air = typeof data.air_quality === "object" && data.air_quality !== null ? data.air_quality : {value:data.air_quality,unit:data.air_quality_unit};
    const rain = data.rain_probability_percent ?? data.rain_probability;
    $("temperature").textContent = format(temp);
    $("humidity").textContent = format(humidity,0);
    $("pressure").textContent = format(pressure);
    $("airValue").textContent = format(Number(air?.value),0);
    $("airUnit").textContent = air?.unit || "unid.";
    $("rainChance").textContent = rain == null ? "—" : format(Number(rain),0);
    $("humidityBar").style.width = `${Math.max(0,Math.min(100,Number.isFinite(humidity)?humidity:0))}%`;
    $("rainBar").style.width = `${Math.max(0,Math.min(100,Number.isFinite(Number(rain))?Number(rain):0))}%`;
    $("temperatureDesc").textContent = Number.isFinite(temp) ? (temp < 18 ? "Temperatura baixa" : temp > 30 ? "Temperatura elevada" : "Condição amena") : "Aguardando leitura";
    $("humidityDesc").textContent = Number.isFinite(humidity) ? (humidity < 30 ? "Umidade baixa" : humidity > 70 ? "Umidade alta" : "Umidade moderada") : "Aguardando leitura";
    $("pressureDesc").textContent = Number.isFinite(pressure) ? "Leitura do sensor atmosférico" : "Aguardando leitura";
    $("airDesc").textContent = air?.sensor ? `${air.sensor}${state.demo ? " · demonstrativo" : ""}` : "Tipo de sensor não informado";
    $("airStatus").textContent = state.demo ? "DEMO" : "LEITURA";
    $("rainDesc").textContent = rain == null ? "Previsão não configurada" : (data.rain_source || (state.demo ? "Previsão ilustrativa" : "Fonte externa não identificada"));
    const stamp = data.timestamp ? new Date(data.timestamp) : new Date();
    $("lastUpdated").textContent = stamp.toLocaleTimeString("pt-BR");
    $("packetTime").textContent = stamp.toLocaleTimeString("pt-BR");
    if (window.AtmosSatCharts) window.AtmosSatCharts.update(Number.isFinite(temp)?temp:26, Number.isFinite(humidity)?humidity:60, state.range);
    updateAlert(data, temp, humidity);
  }
  function updateAlert(data, temp, humidity) {
    let title = state.demo ? "Modo de demonstração ativo" : "Estação recebendo dados";
    let message = state.demo ? "Os valores apresentados são ilustrativos e não representam medições ambientais reais." : "Último pacote recebido do endpoint configurado. Verifique a origem e a calibração dos sensores.";
    let color = "var(--green)";
    if (!state.demo && (!Number.isFinite(temp) || !Number.isFinite(humidity))) {
      title = "Leitura incompleta"; message = "O endpoint respondeu, mas faltam alguns campos. Confira o formato JSON e os nomes das variáveis."; color = "var(--yellow)";
    } else if (!state.demo && Number.isFinite(temp) && (temp > 35 || temp < 5)) {
      title = "Temperatura fora da faixa configurada"; message = "A leitura está fora da faixa informativa de 5 °C a 35 °C. Confirme o sensor e as condições locais."; color = "var(--yellow)";
    }
    $("alertTitle").textContent = title; $("alertMessage").textContent = message; $("alertSummary").textContent = state.demo ? "Modo de demonstração" : "Monitoramento ativo";
    $("alertSummary").style.color = color;
  }
  async function fetchReal() {
    if (!state.endpoint) return;
    try {
      const response = await fetch(state.endpoint, {cache:"no-store", headers:{Accept:"application/json"}});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data || typeof data !== "object") throw new Error("JSON inválido");
      state.demo = false; setStatus("connected","ESP32 / conectado"); render(data);
    } catch (error) {
      setStatus("disconnected","Sem conexão");
      $("alertTitle").textContent = "Falha ao receber dados";
      $("alertMessage").textContent = `Não foi possível acessar o endpoint (${error.message}). Verifique URL, rede, CORS e se o servidor está ativo.`;
      $("alertSummary").textContent = "Verificar conexão";
      $("alertSummary").style.color = "var(--red)";
    }
  }
  function startDemo() {
    clearInterval(state.timer); state.demo = true; state.endpoint = "";
    setStatus("demo","Modo demonstração"); render(demoData());
    state.timer = setInterval(()=>render(demoData()),5000);
    $("formError").textContent = "";
  }
  function startReal(endpoint, interval) {
    clearInterval(state.timer); state.endpoint = endpoint; state.refreshMs = interval; state.demo = false;
    setStatus("connecting","Conectando…");
    fetchReal(); state.timer = setInterval(fetchReal, interval);
  }
  $("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("light");$("themeToggle").textContent=document.body.classList.contains("light")?"☾":"☼";});
  $("connectBtn").addEventListener("click",()=>{$("endpointInput").value=state.endpoint;$("refreshInput").value=String(state.refreshMs);$("formError").textContent="";$("configDialog").showModal();});
  $("demoBtn").addEventListener("click",startDemo);
  $("configForm").addEventListener("submit",e=>{
    e.preventDefault(); const endpoint=$("endpointInput").value.trim(); const interval=Number($("refreshInput").value);
    if(!endpoint){$("formError").textContent="Informe uma URL válida para o endpoint.";return;}
    try{new URL(endpoint)}catch{$("formError").textContent="A URL informada não é válida.";return;}
    $("configDialog").close(); startReal(endpoint,interval);
  });
  $("testConnectionBtn").addEventListener("click",async()=>{
    const endpoint=$("endpointInput").value.trim();
    if(!endpoint){$("formError").textContent="Informe a URL do endpoint antes de testar.";return;}
    $("formError").textContent="Testando conexão…";
    try {const r=await fetch(endpoint,{cache:"no-store",headers:{Accept:"application/json"}});if(!r.ok)throw new Error(`HTTP ${r.status}`);const d=await r.json();if(!d||typeof d!=="object")throw new Error("JSON inválido");$("formError").style.color="var(--green)";$("formError").textContent="Conexão testada: o endpoint respondeu com JSON válido.";}
    catch(err){$("formError").style.color="var(--red)";$("formError").textContent=`Falha no teste: ${err.message}. Confira a rede e a configuração de CORS.`;}
  });
  document.querySelectorAll(".range-btn").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".range-btn").forEach(b=>b.classList.toggle("active",b===btn));
    state.range=Number(btn.dataset.range);
    if(window.AtmosSatCharts)window.AtmosSatCharts.setRange(state.range);
    if(state.lastData)render(state.lastData);
  }));
  window.addEventListener("DOMContentLoaded",()=>{if(window.AtmosSatCharts)window.AtmosSatCharts.init();});
  startDemo();
})();