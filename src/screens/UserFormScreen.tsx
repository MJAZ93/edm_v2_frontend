import React from 'react'
import { Card } from '../components'

export default function UserFormScreen() {
  return (
    <Card
      title="Gestão de utilizadores"
      subtitle="O fluxo de criação e edição está integrado diretamente na listagem de utilizadores para reduzir navegação desnecessária."
    >
      <p style={{ margin: 0, color: '#5f6673', lineHeight: 1.6 }}>
        Utilize a ação <strong>Adicionar utilizador</strong> ou os botões de <strong>Editar</strong> e <strong>Apagar</strong> na tabela principal.
      </p>
    </Card>
  )
}
