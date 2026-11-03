// Chave de armazenamento local
const STORAGE_KEY = 'agenda_contactos_db';

// Elementos da interface
const form = document.getElementById('form-contacto');
const idInput = document.getElementById('contacto-id');
const nomeInput = document.getElementById('nome');
const emailInput = document.getElementById('email');
const telefoneInput = document.getElementById('telefone');
const dataNascimentoInput = document.getElementById('data-nascimento');
const cepInput = document.getElementById('cep');
const logradouroInput = document.getElementById('logradouro');
const numeroInput = document.getElementById('numero');
const bairroInput = document.getElementById('bairro');
const localidadeInput = document.getElementById('localidade');
const ufInput = document.getElementById('uf');
const cepErro = document.getElementById('cep-erro');
const btnGravar = document.getElementById('btn-gravar');
const btnCancelar = document.getElementById('btn-cancelar');
const formTitulo = document.getElementById('form-titulo');
const tabelaBody = document.getElementById('tabela-contactos');
const totalRegistos = document.getElementById('total-registos');

// Obter dados do LocalStorage
function obterContactos() {
  const contactos = localStorage.getItem(STORAGE_KEY);
  return contactos ? JSON.parse(contactos) : [];
}

// Guardar lista no LocalStorage
function guardarContactos(contactos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contactos));
}

// Consulta de Endereço via API ViaCEP
cepInput.addEventListener('blur', async () => {
  const cepLimpo = cepInput.value.replace(/\D/g, '');

  if (cepLimpo.length !== 8) {
    limparCamposEndereco();
    return;
  }

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const dados = await resposta.json();

    if (dados.erro) {
      cepErro.classList.remove('d-none');
      limparCamposEndereco();
    } else {
      cepErro.classList.add('d-none');
      logradouroInput.value = dados.logradouro || '';
      bairroInput.value = dados.bairro || '';
      localidadeInput.value = dados.localidade || '';
      ufInput.value = dados.uf || '';
      numeroInput.focus();
    }
  } catch (error) {
    console.error('Falha ao consultar a API ViaCEP:', error);
    cepErro.classList.remove('d-none');
  }
});

function limparCamposEndereco() {
  logradouroInput.value = '';
  bairroInput.value = '';
  localidadeInput.value = '';
  ufInput.value = '';
}

// Renderização da tabela de contactos
function renderizarTabela() {
  const contactos = obterContactos();
  tabelaBody.innerHTML = '';
  totalRegistos.textContent = `${contactos.length} contacto(s)`;

  if (contactos.length === 0) {
    tabelaBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-muted">Nenhum contacto registado.</td>
      </tr>
    `;
    return;
  }

  contactos.forEach((c) => {
    const linha = document.createElement('tr');
    
    // Formatar data para exibição (dd/mm/aaaa)
    const partesData = c.dataNascimento ? c.dataNascimento.split('-') : [];
    const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : '-';

    const enderecoFormatado = `${c.logradouro || ''}, ${c.numero || 'S/N'} - ${c.bairro || ''}, ${c.localidade || ''}/${c.uf || ''} (CEP: ${c.cep})`;

    linha.innerHTML = `
      <td><strong>${c.nome}</strong></td>
      <td>${c.email}</td>
      <td>${c.telefone}</td>
      <td>${dataFormatada}</td>
      <td><small>${enderecoFormatado}</small></td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-warning" onclick="carregarParaEditar('${c.id}')">Editar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarContacto('${c.id}')">Eliminar</button>
      </td>
    `;
    tabelaBody.appendChild(linha);
  });
}

// Submissão do formulário (Criação e Atualização)
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const contactos = obterContactos();
  const id = idInput.value;

  const novoRegisto = {
    id: id || Date.now().toString(),
    nome: nomeInput.value.trim(),
    email: emailInput.value.trim(),
    telefone: telefoneInput.value.trim(),
    dataNascimento: dataNascimentoInput.value,
    cep: cepInput.value.trim(),
    logradouro: logradouroInput.value.trim(),
    numero: numeroInput.value.trim(),
    bairro: bairroInput.value.trim(),
    localidade: localidadeInput.value.trim(),
    uf: ufInput.value.trim()
  };

  if (id) {
    // Atualização (Update)
    const index = contactos.findIndex((c) => c.id === id);
    if (index !== -1) contactos[index] = novoRegisto;
  } else {
    // Criação (Create)
    contactos.push(novoRegisto);
  }

  guardarContactos(contactos);
  redefinirFormulario();
  renderizarTabela();
});

// Preparar formulário para edição
window.carregarParaEditar = function (id) {
  const contactos = obterContactos();
  const contacto = contactos.find((c) => c.id === id);

  if (!contacto) return;

  idInput.value = contacto.id;
  nomeInput.value = contacto.nome;
  emailInput.value = contacto.email;
  telefoneInput.value = contacto.telefone;
  dataNascimentoInput.value = contacto.dataNascimento;
  cepInput.value = contacto.cep;
  logradouroInput.value = contacto.logradouro;
  numeroInput.value = contacto.numero;
  bairroInput.value = contacto.bairro;
  localidadeInput.value = contacto.localidade;
  ufInput.value = contacto.uf;

  formTitulo.textContent = 'Editar Contacto';
  btnGravar.textContent = 'Guardar Alterações';
  btnCancelar.classList.remove('d-none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Cancelar Edição
btnCancelar.addEventListener('click', () => {
  redefinirFormulario();
});

// Eliminar Contacto (Delete)
window.eliminarContacto = function (id) {
  if (confirm('Tem a certeza de que pretende eliminar este contacto?')) {
    let contactos = obterContactos();
    contactos = contactos.filter((c) => c.id !== id);
    guardarContactos(contactos);
    renderizarTabela();
    redefinirFormulario();
  }
};

// Limpar e restaurar estado inicial do formulário
function redefinirFormulario() {
  form.reset();
  idInput.value = '';
  formTitulo.textContent = 'Adicionar Contacto';
  btnGravar.textContent = 'Guardar Contacto';
  btnCancelar.classList.add('d-none');
  cepErro.classList.add('d-none');
}

// Inicialização
document.addEventListener('DOMContentLoaded', renderizarTabela);