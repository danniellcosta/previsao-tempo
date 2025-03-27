// Objeto principal da aplicação
const AplicacaoClima = {
    // Configurações
    config: {
      chaveApi: 'ced8e8140ae1e331de8ef24011df98ea',
      ultimaCidade: null,
      nomeUltimaCidade: null,
      coordenadas: { latitude: null, longitude: null }
    },
  
    // Inicialização
    iniciar() {
      this.carregarUltimaCidade();
      this.configurarEventos();
    },
  
    // Configura os eventos
    configurarEventos() {
      document.querySelector('.local-btn').addEventListener('click', () => this.buscarClima());
      document.getElementById('local').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.buscarClima();
      });
    },
  
    // Carrega a última cidade pesquisada
    carregarUltimaCidade() {
      const cidade = localStorage.getItem('ultimaCidade');
      if (cidade) {
        document.getElementById('local').value = cidade;
        this.config.ultimaCidade = cidade;
        this.config.nomeUltimaCidade = localStorage.getItem('ultimaCidadeNome');
        this.buscarClima();
      }
    },
  
    // Função principal para buscar o clima
    buscarClima() {
      const cidade = document.getElementById('local').value.trim();
      
      if (!cidade) {
        this.mostrarMensagem('Por favor, insira o nome de uma cidade.');
        return;
      }
  
      this.mostrarLoader();
      this.ocultarTodasSecoes();
  
      const urlGeocoding = `https://api.openweathermap.org/geo/1.0/direct?q=${cidade}&limit=1&appid=${this.config.chaveApi}`;
  
      fetch(urlGeocoding)
        .then(resposta => resposta.json())
        .then(dados => this.processarRespostaGeocoding(dados, cidade))
        .catch(erro => this.tratarErro('Erro ao buscar a cidade.', erro))
        .finally(() => this.ocultarLoader());
    },
  
    // Processa a resposta da API de geolocalização
    processarRespostaGeocoding(dados, cidade) {
      if (dados.length === 0) {
        this.mostrarMensagem('Cidade não encontrada!');
        return;
      }
  
      this.config.coordenadas.latitude = dados[0].lat;
      this.config.coordenadas.longitude = dados[0].lon;
      this.config.ultimaCidade = cidade;
      this.config.nomeUltimaCidade = dados[0].name;
  
      // Salva no localStorage
      localStorage.setItem('ultimaCidade', cidade);
      localStorage.setItem('ultimaCidadeNome', dados[0].name);
  
      // Mostra os botões de navegação
      document.getElementById('topic-buttons').classList.remove('hidden');
      
      // Mostra a previsão atual por padrão
      this.mostrarPrevisaoAtual();
    },
  
    // Mostra a previsão atual
    mostrarPrevisaoAtual() {
      this.ocultarSecao('dias-previsao');
      this.mostrarSecao('previsao-atual');
      this.buscarPrevisaoAtual();
    },
  
    // Busca os dados da previsão atual
    buscarPrevisaoAtual() {
      this.mostrarLoader();
      
      const { latitude, longitude } = this.config.coordenadas;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.config.chaveApi}&units=metric&lang=pt_br`;
  
      fetch(url)
        .then(resposta => resposta.json())
        .then(dados => this.exibirPrevisaoAtual(dados))
        .catch(erro => this.tratarErro('Erro ao buscar previsão atual.', erro))
        .finally(() => this.ocultarLoader());
    },
  
    // Exibe os dados da previsão atual
    exibirPrevisaoAtual(dados) {
      const icone = dados.weather[0].icon;
      const html = `
        <h3>Previsão Atual em ${this.config.nomeUltimaCidade}</h3>
        <img class="weather-icon" src="https://openweathermap.org/img/wn/${icone}@4x.png" alt="Ícone do Clima">
        <p><strong>Condição:</strong> ${dados.weather[0].description}</p>
        <p><strong>Temperatura:</strong> ${dados.main.temp}°C</p>
        <p><strong>Máxima:</strong> ${dados.main.temp_max}°C</p>
        <p><strong>Mínima:</strong> ${dados.main.temp_min}°C</p>
        <p><strong>Sensação:</strong> ${dados.main.feels_like}°C</p>
        <p><strong>Vento:</strong> ${dados.wind.speed} m/s</p>
        <p><strong>Umidade:</strong> ${dados.main.humidity}%</p>
      `;
      
      document.getElementById('previsao-atual').innerHTML = html;
    },
  
    // Mostra a previsão futura
    mostrarPrevisaoFutura() {
      this.ocultarSecao('previsao-atual');
      this.mostrarSecao('dias-previsao');
      this.buscarPrevisaoFutura();
    },
  
    // Busca os dados da previsão futura
    buscarPrevisaoFutura() {
      this.mostrarLoader();
      
      const { latitude, longitude } = this.config.coordenadas;
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${this.config.chaveApi}&units=metric&lang=pt_br`;
  
      fetch(url)
        .then(resposta => resposta.json())
        .then(dados => this.processarPrevisaoFutura(dados))
        .catch(erro => this.tratarErro('Erro ao buscar previsão futura.', erro))
        .finally(() => this.ocultarLoader());
    },
  
    // Processa os dados da previsão futura
    processarPrevisaoFutura(dados) {
        const dias = this.agruparPorDia(dados.list);
        const containerBotoes = document.getElementById('buttons-dia');
        
        // Limpa os botões anteriores
        containerBotoes.innerHTML = '';
        
        // Cria os novos botões
        dias.forEach(dia => {
          const button = document.createElement('button');
          button.className = 'button-dias-futuro';
          button.textContent = dia.data;
          button.addEventListener('click', () => this.exibirPrevisaoDia(dia));
          containerBotoes.appendChild(button);
        });
        
        // Mostra a previsão do primeiro dia por padrão
        if (dias.length > 0) {
          this.exibirPrevisaoDia(dias[0]);
        }
        
        // Garante que a seção está visível
        this.mostrarSecao('dias-previsao');
      },
  
    // Exibe a previsão de um dia específico
    exibirPrevisaoDia(dia) {
        const container = document.getElementById('previsao-futura');
        container.innerHTML = `
          <h3>Previsão para ${dia.data} em ${this.config.nomeUltimaCidade}</h3>
          <img class="weather-icon" src="https://openweathermap.org/img/wn/${dia.icone}@4x.png" alt="Ícone do Clima">
          <p><strong>Temperatura Máxima:</strong> ${dia.temp_max}°C</p>
          <p><strong>Temperatura Mínima:</strong> ${dia.temp_min}°C</p>
          <p><strong>Condição do Tempo:</strong> ${dia.descricao}</p>
        `;
        
        // Adiciona classe ativa ao botão selecionado
        const buttons = document.querySelectorAll('.button-dias-futuro');
        buttons.forEach(btn => {
          btn.classList.remove('active');
          if (btn.textContent === dia.data) {
            btn.classList.add('active');
          }
        });
      },
  
    // Agrupa as previsões por dia
    agruparPorDia(listaPrevisao) {
      const dias = {};
      const hoje = new Date().toLocaleDateString();
      
      listaPrevisao.forEach(item => {
        const data = new Date(item.dt * 1000).toLocaleDateString();
        
        if (data === hoje) return;
        
        if (!dias[data]) {
          dias[data] = {
            data,
            temp_max: item.main.temp_max,
            temp_min: item.main.temp_min,
            descricao: item.weather[0].description,
            icone: item.weather[0].icon
          };
        } else {
          dias[data].temp_max = Math.max(dias[data].temp_max, item.main.temp_max);
          dias[data].temp_min = Math.min(dias[data].temp_min, item.main.temp_min);
        }
      });
      
      return Object.values(dias).slice(0, 5);
    },
  
    // Funções auxiliares
    mostrarLoader() {
      document.querySelector('.loader').style.display = 'block';
    },
  
    ocultarLoader() {
      document.querySelector('.loader').style.display = 'none';
    },
  
    mostrarMensagem(mensagem) {
      const elemento = document.getElementById('text-msg');
      elemento.innerText = mensagem;
      elemento.classList.remove('hidden');
    },
  
    ocultarTodasSecoes() {
      document.getElementById('text-msg').classList.add('hidden');
      document.getElementById('previsao-atual').classList.add('hidden');
      document.getElementById('dias-previsao').classList.add('hidden');
    },
  
    mostrarSecao(idSecao) {
      document.getElementById(idSecao).classList.remove('hidden');
    },
  
    ocultarSecao(idSecao) {
      document.getElementById(idSecao).classList.add('hidden');
    },
  
    tratarErro(mensagem, erro) {
      console.error(mensagem, erro);
      this.mostrarMensagem(mensagem);
    }
  };
  
  // Inicializa a aplicação quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => AplicacaoClima.iniciar());