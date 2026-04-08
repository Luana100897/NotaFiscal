import { useMemo, useState } from 'react'
import './App.css'

const createItem = () => ({
  descricao: '',
  qtd: 1,
  valorUnitario: 0,
  desconto: 0,
  aliquota: 0,
})

const toNumber = (value) => {
  const normalized = Number.parseFloat(String(value).replace(',', '.'))
  return Number.isNaN(normalized) ? 0 : normalized
}

const money = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function App() {
  const [cabecalho, setCabecalho] = useState({
    numero: '000001',
    serie: '1',
    dataEmissao: new Date().toISOString().slice(0, 10),
    formaPagamento: 'PIX',
  })

  const [emitente, setEmitente] = useState({
    razaoSocial: 'Casa Bia pet',
    cnpj: '54302078000190',
    ie: '',
    endereco: 'Jd.morumbi, AV. Benedito Bento n:740',
  })

  const [cliente, setCliente] = useState({
    nome: '',
    documento: '',
    endereco: '',
  })

  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState([createItem()])

  const itensCalculados = useMemo(
    () =>
      itens.map((item) => {
        const qtd = Math.max(toNumber(item.qtd), 0)
        const valorUnitario = Math.max(toNumber(item.valorUnitario), 0)
        const desconto = Math.max(toNumber(item.desconto), 0)
        const aliquota = Math.max(toNumber(item.aliquota), 0)
        const subtotal = qtd * valorUnitario
        const base = Math.max(subtotal - desconto, 0)
        const imposto = (base * aliquota) / 100

        return { ...item, qtd, valorUnitario, desconto, aliquota, subtotal, imposto }
      }),
    [itens],
  )

  const resumo = useMemo(() => {
    const subtotal = itensCalculados.reduce((acc, item) => acc + item.subtotal, 0)
    const descontos = itensCalculados.reduce((acc, item) => acc + item.desconto, 0)
    const impostos = itensCalculados.reduce((acc, item) => acc + item.imposto, 0)
    const totalLiquido = Math.max(subtotal - descontos + impostos, 0)

    return { subtotal, descontos, impostos, totalLiquido }
  }, [itensCalculados])

  const updateCabecalho = (field, value) => {
    setCabecalho((prev) => ({ ...prev, [field]: value }))
  }

  const updateEmitente = (field, value) => {
    setEmitente((prev) => ({ ...prev, [field]: value }))
  }

  const updateCliente = (field, value) => {
    setCliente((prev) => ({ ...prev, [field]: value }))
  }

  const updateItem = (index, field, value) => {
    setItens((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    )
  }

  const addItem = () => setItens((prev) => [...prev, createItem()])

  const removeItem = (index) => {
    setItens((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)))
  }

  return (
    <div className="nf-app">
      <header className="nf-header">
        <p className="nf-kicker">Emissao rapida</p>
        <h1>Nota Fiscal / Cupom Fiscal</h1>
        <p className="nf-subtitle">
          Preencha os dados da venda, confira os totais e imprima o documento.
        </p>
      </header>

      <main className="nf-grid">
        <section className="card">
          <h2>Cabecalho da Nota</h2>
          <div className="form-grid cols-4">
            <label>
              Numero
              <input
                value={cabecalho.numero}
                onChange={(e) => updateCabecalho('numero', e.target.value)}
              />
            </label>
            <label>
              Serie
              <input
                value={cabecalho.serie}
                onChange={(e) => updateCabecalho('serie', e.target.value)}
              />
            </label>
            <label>
              Data de emissao
              <input
                type="date"
                value={cabecalho.dataEmissao}
                onChange={(e) => updateCabecalho('dataEmissao', e.target.value)}
              />
            </label>
            <label>
              Pagamento
              <select
                value={cabecalho.formaPagamento}
                onChange={(e) => updateCabecalho('formaPagamento', e.target.value)}
              >
                <option>PIX</option>
                <option>Cartao</option>
                <option>Dinheiro</option>
                <option>Boleto</option>
              </select>
            </label>
          </div>
        </section>

        <section className="card">
          <h2>Emitente</h2>
          <div className="form-grid cols-2">
            <label>
              Razao social
              <input
                value={emitente.razaoSocial}
                readOnly
              />
            </label>
            <label>
              CNPJ
              <input value={emitente.cnpj} readOnly />
            </label>
            <label>
              IE
              <input value={emitente.ie} onChange={(e) => updateEmitente('ie', e.target.value)} />
            </label>
            <label>
              Endereco
              <input
                value={emitente.endereco}
                readOnly
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h2>Cliente</h2>
          <div className="form-grid cols-2">
            <label>
              Nome
              <input value={cliente.nome} onChange={(e) => updateCliente('nome', e.target.value)} />
            </label>
            <label>
              CPF/CNPJ
              <input
                value={cliente.documento}
                onChange={(e) => updateCliente('documento', e.target.value)}
              />
            </label>
            <label className="span-2">
              Endereco
              <input
                value={cliente.endereco}
                onChange={(e) => updateCliente('endereco', e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="card">
          <div className="row-between">
            <h2>Itens</h2>
            <button className="btn btn-ghost" type="button" onClick={addItem}>
              + Adicionar item
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Descricao</th>
                  <th>Qtd</th>
                  <th>Unitario</th>
                  <th>Desconto</th>
                  <th>Aliq. %</th>
                  <th>Subtotal</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {itensCalculados.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        value={item.descricao}
                        placeholder="Produto ou servico"
                        onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.qtd}
                        onChange={(e) => updateItem(index, 'qtd', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.valorUnitario}
                        onChange={(e) => updateItem(index, 'valorUnitario', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.desconto}
                        onChange={(e) => updateItem(index, 'desconto', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.aliquota}
                        onChange={(e) => updateItem(index, 'aliquota', e.target.value)}
                      />
                    </td>
                    <td className="money">{money(Math.max(item.subtotal - item.desconto, 0))}</td>
                    <td>
                      <button className="btn btn-danger" type="button" onClick={() => removeItem(index)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2>Resumo financeiro</h2>
          <div className="resume-grid">
            <article>
              <span>Subtotal</span>
              <strong>{money(resumo.subtotal)}</strong>
            </article>
            <article>
              <span>Descontos</span>
              <strong>{money(resumo.descontos)}</strong>
            </article>
            <article>
              <span>Impostos</span>
              <strong>{money(resumo.impostos)}</strong>
            </article>
            <article className="highlight">
              <span>Total</span>
              <strong>{money(resumo.totalLiquido)}</strong>
            </article>
          </div>
          <label className="obs">
            Observacoes
            <textarea
              rows="3"
              value={observacoes}
              placeholder="Informacoes complementares da venda"
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => window.print()}>
              Emitir e imprimir cupom
            </button>
          </div>
        </section>

        <section className="card cupom-preview">
          <h2>Pre-visualizacao do cupom</h2>
          <div className="ticket">
            <p className="ticket-title">{emitente.razaoSocial || 'Emitente'}</p>
            <p>CNPJ: {emitente.cnpj || 'Nao informado'}</p>
            <p>IE: {emitente.ie || 'Nao informado'}</p>
            <p>{emitente.endereco || 'Endereco nao informado'}</p>
            <hr />
            <p>
              Nota {cabecalho.numero} - Serie {cabecalho.serie}
            </p>
            <p>Data: {cabecalho.dataEmissao || '-'}</p>
            <p>Pagamento: {cabecalho.formaPagamento}</p>
            <p>Cliente: {cliente.nome || 'Consumidor final'}</p>
            <p>Documento: {cliente.documento || '-'}</p>
            <hr />
            {itensCalculados.map((item, index) => (
              <p key={index}>
                {(item.descricao || 'Item') + ' x' + item.qtd} - {money(Math.max(item.subtotal - item.desconto, 0))}
              </p>
            ))}
            <hr />
            <p>Subtotal: {money(resumo.subtotal)}</p>
            <p>Descontos: {money(resumo.descontos)}</p>
            <p>Impostos: {money(resumo.impostos)}</p>
            <p className="ticket-total">TOTAL: {money(resumo.totalLiquido)}</p>
            {!!observacoes && (
              <>
                <hr />
                <p>Obs: {observacoes}</p>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
