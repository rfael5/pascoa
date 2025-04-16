import React, { useEffect, useState } from 'react';
import './App.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function App() {
  const [dados, setDados] = useState([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [maisRepetidos, setMaisRepetidos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [filtrosAtivos, setFiltrosAtivos] = useState([]);
  
  
  const buscarPedidos = async (e = null) => {
    if (e) e.preventDefault(); // Previne o comportamento padrão do formulário apenas se `e` existir
    
    if (!dataInicio || !dataFim) return;
    
    setCarregando(true);
    setErro(null);
    try {
      const response = await fetch(`http://192.168.1.250/server-pascoa/documentos-movimentos?dataInicio=${dataInicio}&dataFim=${dataFim}`);
      if (!response.ok) throw new Error('Erro ao buscar dados');
      const json = await response.json();
      setDados(json);

      const contador = {};
      json.forEach(item => {
        const key = item.CODPRODUTO;
        const quantidade = item.L_QUANTIDADE;
        const preco = item.L_PRECOTOTAL;

        if (!contador[key]) {
          contador[key] = { ...item, preco: parseFloat(preco) || 0, quantidade: Math.round(quantidade * 100) / 100, aparicoes: 1 };
        } else {
          contador[key].quantidade += Math.round(quantidade * 100) / 100;
          contador[key].aparicoes += 1;
          contador[key].preco += parseFloat(preco) || 0; // Garante que o preço seja numérico
        }

      });

      const repetidosOrdenados = Object.values(contador).sort((a, b) => b.aparicoes - a.aparicoes);
      setMaisRepetidos(repetidosOrdenados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };
  const removerAcentos = (str) => {
    return str
      .normalize("NFD") // Separa caracteres acentuados
      .replace(/[\u0300-\u036f]/g, "") // Remove os diacríticos (acentos)
      .toLowerCase(); // Converte para minúsculas
  };

  const aplicarFiltro = (e) => {
    e.preventDefault();
    if (filtro.trim()) {
      const novosFiltros = filtro.trim().split(/\s+/);
      setFiltrosAtivos([...new Set([...filtrosAtivos, ...novosFiltros])]);
      setFiltro("");
    }
  };

  const removerFiltro = (palavra) => {
    setFiltrosAtivos(filtrosAtivos.filter((f) => f !== palavra));
  };
  
  const atendeFiltros = (descricao) => {
    if (filtrosAtivos.length === 0) return true;
  
    const descricaoNormalizada = removerAcentos(descricao.toLowerCase());
  
    return filtrosAtivos.some((filtro) =>
      descricaoNormalizada.includes(removerAcentos(filtro.toLowerCase()))
    );
  };
  
  
  
  const filtrarRepetidos = maisRepetidos.filter(item => atendeFiltros(item.DESCRICAO));
  const filtrarDados = dados.filter(item => atendeFiltros(item.DESCRICAO));

  const cleanText = (text) => text.replace(/[^\x20-\x7E]/g, ''); // Remove caracteres não imprimíveis
  const formatDate = (dateString) => {
    const date = new Date(dateString);

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Meses começam em 0, então somamos 1
    const year = date.getUTCFullYear();

    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    // Formato Europeu: DD/MM/YYYY HH:mm
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };
  const totalPreco = filtrarRepetidos.reduce((total, item) => total + item.preco, 0);

  const exportarParaExcel = () => {
    const wsPedidos = XLSX.utils.json_to_sheet(
      filtrarDados.map(({ PK_DOCTOPED, DOCUMENTO, TPDOCTO,IDX_LINHA, NOME, DTPREVISAO, CODPRODUTO, DESCRICAO, UNIDADE, L_QUANTIDADE, L_PRECOTOTAL, IDX_NEGOCIO }) => ({
        Pedido: PK_DOCTOPED,
        Numero_EC: DOCUMENTO,
        Setor: IDX_LINHA,
        Tipo: TPDOCTO,
        Nome: NOME,
        Previsão: formatDate(DTPREVISAO),
        Produto: CODPRODUTO,
        Descrição: DESCRICAO,
        Unidade: UNIDADE,
        Quantidade: L_QUANTIDADE.toFixed(2),
        Valor: L_PRECOTOTAL,
        Negócio: IDX_NEGOCIO
      }))
    );

    const wsRepetidos = XLSX.utils.json_to_sheet(
      filtrarRepetidos.map(({ CODPRODUTO, DESCRICAO, IDX_LINHA, quantidade, UNIDADE, aparicoes, preco }) => ({
        Produto: CODPRODUTO,
        Descrição: DESCRICAO,
        Setor: IDX_LINHA,
        Quantidade: quantidade.toFixed(2),
        Unidade: UNIDADE,
        Pedidos: aparicoes,
        "Valor Total": preco
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsPedidos, "Todos os Pedidos");
    XLSX.utils.book_append_sheet(wb, wsRepetidos, "Itens Mais Pedidos");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    if (data != null) {
      saveAs(data, "Relatorio_Pedidos.xlsx");
    }
  };



  useEffect(() => { // Opcional: limpa os dados quando o intervalo de datas muda
  }, [dataInicio, dataFim]);

  return (
    <div >
      <div className='navbar'>
        <img data-perfmatters-preload="" src="https://souttomayorevoce.com.br/wp-content/themes/soutto/images/logo-soutto.png" alt="Célia Soutto Mayor - Buffet em BH | Célia Soutto Mayor" title="Célia Soutto Mayor" class="webpexpress-processed no-lazy"></img>
      </div>
      <div className='body'>


        {/* <form onSubmit={handleSubmit}>
            <label>
              <i className="icon email-icon"></i>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              <i className="icon senha-icon"></i>
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="submit-btn">
              {"Entrar"}
            </button>
          </form> */}
        <div className='busca'>

          <form onSubmit={buscarPedidos}>
            <label>
              Início:&nbsp;
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </label>
            &nbsp;&nbsp;
            <label>
              Fim:&nbsp;
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </label>
            &nbsp;&nbsp;
            <button className="submit-btn" type="submit">Buscar</button>
          </form>
          <br></br>
      <div className="filtros-container">
        {filtrosAtivos.map((f, i) => (
          <span key={i} className="filtro-balao">
            {f}
            <button className="remover-filtro" onClick={() => removerFiltro(f)}>✖</button>
          </span>
        ))}
      </div>
          <form onSubmit={aplicarFiltro} className="formulario">
        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Digite um filtro..."
          className="input-filtro"
        />&nbsp;
        <button type="submit" className="submit-btn">
          Aplicar
        </button>
      </form>

        </div>
        {carregando && <p>Carregando...</p>}
        {erro && <p style={{ color: 'red' }}>{erro}</p>}

        {/* Tabela Principal */}
        {filtrarDados.length > 0 && (
          <>
            <h3>Todos os Pedidos</h3>

            <section class="">
              <div className='container'>
                <table>
                  <thead>
                    <tr>
                      <th>Numero EC<div>Numero EC</div></th>
                      <th>Tipo<div>Tipo</div></th>
                      <th>Setor<div>Setor</div></th>
                      <th>Nome<div>Nome </div></th>
                      <th>Previsão<div>Previsão</div></th>
                      <th>Produto<div>Produto</div></th>
                      <th>Descrição<div>Descrição</div></th>
                      <th>Unidade<div>Unidade</div></th>
                      <th>Qnt<div>Qnt</div></th>
                      <th>Valor<div>Valor</div></th>
                      <th>Ngc<div>Ngc</div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrarDados.map((item, index) => (
                      <tr key={index}>
                        <td>{item.DOCUMENTO}</td>
                        <td>{item.TPDOCTO}</td>
                        <td>{cleanText(item.IDX_LINHA)}</td>
                        <td>{item.NOME}</td>
                        <td>{formatDate(item.DTPREVISAO)}</td>
                        <td>{cleanText(item.CODPRODUTO)}</td>
                        <td>{item.DESCRICAO}</td>
                        <td>{item.UNIDADE}</td>
                        <td>{Math.round(item.L_QUANTIDADE * 100) / 100}</td> {/* Arredondando a quantidade */}
                        <td>R$ {item.L_PRECOTOTAL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>{cleanText(item.IDX_NEGOCIO)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* Tabela dos Itens mais Repetidos */}
        {maisRepetidos.length > 0 && (
          <>
            <h3 style={{ marginTop: '2rem' }}>Itens mais pedidos</h3>
            <section class="">

              <div class='container'>
                <table >
                  <thead>
                    <tr>
                      <th>
                        <div>Produto</div>
                      </th>
                      <th>Descrição<div>Descrição</div></th>
                      <th>Setor<div>Setor</div></th>
                      <th>Quantidade<div>Quantidade</div></th>
                      <th>Unidade<div>Unidade</div></th>
                      <th>Pedidos<div>Pedidos</div></th>
                      <th>Valor Total<div>Valor Total</div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrarRepetidos.map((item, index) => (
                      <tr key={index}>
                        <td>{cleanText(item.CODPRODUTO)}</td>
                        <td>{item.DESCRICAO}</td>
                        <td>{cleanText(item.IDX_LINHA)}</td>
                        <td>{item.quantidade.toFixed(2)}</td> {/* Arredondando na exibição */}
                        <td>{item.UNIDADE}</td>
                        <td>{item.aparicoes}</td>
                        <td>R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>

                    ))}
                  </tbody>
                  <tr>
                    <td colSpan="6" style={{ fontWeight: 'bold', textAlign: 'right' }}>Total:</td>
                    <td style={{ fontWeight: 'bold' }}>
                      R$ {totalPreco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </table>
              </div>
            </section>
            <br/>
            <div className='botao-excel'>
            <button className="submit-btn" onClick={exportarParaExcel}>
              Exportar para Excel 📊
            </button>
            </div>
          </>
        )}

        {!carregando && dados.length === 0 && <p>Nenhum dado encontrado para o período informado.</p>}

        <br />
        <br />
      </div>
    </div>
  );
}

export default App;
