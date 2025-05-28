## Flood Assistance System
Um sistema de assistência para usuários em situações vulneráveis durante eventos de inundação, fornecendo orientações geoespaciais, instruções de segurança e informações meteorológicas em tempo real.
## Descrição
O Flood Assistance System é uma aplicação baseada em inteligência artificial projetada para auxiliar pessoas durante emergências de alagamentos. Utilizando o modelo Gemini da Google e diversas APIs geoespaciais, o sistema fornece:

- Informações meteorológicas em tempo real
- Avaliação de riscos de chuvas e alagamentos
- Rotas seguras para deslocamento até locais seguros
- Instruções detalhadas de navegação passo a passo

## Tecnologias Utilizadas
- LangChain e LangGraph para orquestração de agentes LLM
- Google Gemini AI para processamento de linguagem natural
- MCP (Model Context Protocol) para comunicação entre componentes
- APIs do Google Maps para geocodificação e rotas
- APIs Meteorológicas para previsão do tempo e alertas

## Instalação
Pré-requisitos
- Python 3.10 ou superior
- uv para gerenciamento de dependências
 - Chaves de API para:
    - Google Gemini AI
    - Google Maps Platform  -(Directions & Geocoding APIs)
    - Serviço de previsão meteorológica

## Configuração
1. Clone o repositório:
```bash
 git clone https://github.com/seu-usuario/flood-assistance-system.git

cd flood-assistance-system
```
2. Instale uv (se ainda não estiver instalado)
```bash
pip install uv
```
3. Configure o ambiente virtual com uv:
``` bash
uv venv .venv
source .venv/bin/activate  # Linux/MacOS
# ou
.venv\Scripts\activate     # Windows
```
4. Instale as dependências com uv:
``` bash
uv pip install -e .
```

##  Como Usar
1. Inicie a aplicação:
``` bash
python main
``` 
2. Na interface do sistema, informe:

    - Sua localização atual (endereço completo)
    - O destino seguro desejado (endereço completo)
3. O sistema irá:

    - Converter os endereços em coordenadas geográficas
    - Consultar condições meteorológicas atuais
    - Calcular a melhor rota entre os pontos
    - Fornecer instruções detalhadas de navegação
    - Informar o tempo estimado de deslocamento