# ModelInstalacaoAccoes


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**accao_tipo** | [**ModelInstalacaoAccaoTipo**](ModelInstalacaoAccaoTipo.md) | Foreign key relationships | [optional] [default to undefined]
**accao_tipo_id** | **string** |  | [optional] [default to undefined]
**analise_status** | [**ModelAnaliseStatus**](ModelAnaliseStatus.md) |  | [optional] [default to undefined]
**comentario** | **string** |  | [optional] [default to undefined]
**compras_6_antes** | **number** |  | [optional] [default to undefined]
**compras_6_depois** | **number** |  | [optional] [default to undefined]
**created_at** | **string** |  | [optional] [default to undefined]
**data_execucao** | **string** |  | [optional] [default to undefined]
**id** | **string** |  | [optional] [default to undefined]
**marcacao_status** | [**ModelMarcacaoStatus**](ModelMarcacaoStatus.md) |  | [optional] [default to undefined]
**pf** | **string** |  | [optional] [default to undefined]
**tendencia_compras** | [**ModelTendenciaCompras**](ModelTendenciaCompras.md) |  | [optional] [default to undefined]
**ultimo_mes_analisado** | **string** | UltimoMesAnalisado: first day of the last month processed by the monthly analysis | [optional] [default to undefined]
**updated_at** | **string** |  | [optional] [default to undefined]
**valor_recuperado** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { ModelInstalacaoAccoes } from './api';

const instance: ModelInstalacaoAccoes = {
    accao_tipo,
    accao_tipo_id,
    analise_status,
    comentario,
    compras_6_antes,
    compras_6_depois,
    created_at,
    data_execucao,
    id,
    marcacao_status,
    pf,
    tendencia_compras,
    ultimo_mes_analisado,
    updated_at,
    valor_recuperado,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
