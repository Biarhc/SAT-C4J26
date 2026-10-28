# AtmosSat — Monitoramento Ambiental com ESP32

Dashboard web responsivo para visualizar temperatura, umidade relativa, pressão atmosférica, qualidade do ar e probabilidade de chuva.

## Executar

1. Extraia o arquivo ZIP.
2. Abra a pasta `atmosat`.
3. Para melhor compatibilidade, inicie um servidor local:
   - Python: `python -m http.server 8000`
   - Acesse `http://localhost:8000`
4. O site abre em modo de demonstração. Os dados ficam explicitamente identificados como simulados.

## Conectar ao ESP32

1. Clique em **Configurar conexão**.
2. Informe a URL HTTP que retorna JSON, por exemplo `http://192.168.1.50/data`.
3. Selecione o intervalo de atualização e salve.
4. O endpoint precisa ser acessível pelo navegador e permitir CORS. Se a página estiver hospedada em HTTPS, o navegador pode bloquear endpoints HTTP por conteúdo misto.
5. Se o dispositivo estiver em outra rede, utilize um backend acessível ou um broker MQTT seguro com uma integração apropriada.

### Formato JSON esperado

```json
{
  "device_id": "atmosat-esp32-01",
  "timestamp": "2026-10-28T11:30:00Z",
  "temperature_c": 25.4,
  "humidity_percent": 60,
  "pressure_hpa": 1012.4,
  "air_quality": {
    "value": 18,
    "unit": "µg/m³",
    "sensor": "PM2.5"
  },
  "rain_probability_percent": null,
  "rain_source": "API meteorológica",
  "rain_detected": false
}
```

Campos aceitos também incluem `temperature`, `humidity`, `pressure` e `rain_probability` como aliases simples.

## Notas importantes

- O modo de demonstração gera valores ilustrativos, não medições reais.
- A probabilidade de chuva precisa vir de uma fonte de previsão meteorológica. Um sensor de chuva detecta precipitação presente, mas não fornece sozinho a probabilidade futura.
- A classificação de qualidade do ar depende do sensor, do poluente medido e da unidade. Este protótipo não tenta transformar automaticamente qualquer leitura em um índice oficial.
- Para produção, não exponha credenciais ou chaves privadas no JavaScript público.
- Chart.js e fontes web são carregados de CDNs; conexão com a internet é necessária para esses recursos.
