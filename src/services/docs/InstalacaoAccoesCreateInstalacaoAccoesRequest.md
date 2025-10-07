# InstalacaoAccoesCreateInstalacaoAccoesRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**accao_tipo_id** | **string** |  | [default to undefined]
**analise_status** | **string** | Valid values: \&quot;EM_ANALISE\&quot;, \&quot;ANALISADO\&quot; | [optional] [default to undefined]
**comentario** | **string** |  | [optional] [default to undefined]
**data_execucao** | **string** | YYYY-MM-DD format | [default to undefined]
**marcacao_status** | **string** | Valid values: \&quot;EXECUTADO\&quot;, \&quot;MARCADO\&quot; | [optional] [default to undefined]
**pf** | **string** |  | [default to undefined]
**tendencia_compras** | **string** | Valid values: \&quot;CRESCENTE\&quot;, \&quot;DECRESCENTE\&quot;, \&quot;MUITO_CRESCENTE\&quot;, \&quot;MUITO_DECRESCENTE\&quot;, \&quot;NORMAL\&quot;, \&quot;SEM_COMPRAS\&quot; | [optional] [default to undefined]
**valor_recuperado** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { InstalacaoAccoesCreateInstalacaoAccoesRequest } from './api';

const instance: InstalacaoAccoesCreateInstalacaoAccoesRequest = {
    accao_tipo_id,
    analise_status,
    comentario,
    data_execucao,
    marcacao_status,
    pf,
    tendencia_compras,
    valor_recuperado,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
