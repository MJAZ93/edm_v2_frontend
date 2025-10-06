# ModelInfraction


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**created_at** | **string** |  | [optional] [default to undefined]
**fotografias** | **string** | CSV list placeholder | [optional] [default to undefined]
**id** | **string** |  | [optional] [default to undefined]
**infractors** | [**Array&lt;ModelInfractor&gt;**](ModelInfractor.md) |  | [optional] [default to undefined]
**lat** | **number** |  | [optional] [default to undefined]
**_long** | **number** |  | [optional] [default to undefined]
**material** | [**ModelMaterial**](ModelMaterial.md) |  | [optional] [default to undefined]
**material_id** | **string** | Stores the Material ID in column tipo_material for backward-compatible schema | [optional] [default to undefined]
**occurrence_id** | **string** |  | [optional] [default to undefined]
**quantidade** | **number** |  | [optional] [default to undefined]
**sector_infracao** | [**ModelSectorInfracao**](ModelSectorInfracao.md) |  | [optional] [default to undefined]
**sector_infracao_id** | **string** |  | [optional] [default to undefined]
**tipo_infracao** | [**ModelTipoInfracao**](ModelTipoInfracao.md) | Relations | [optional] [default to undefined]
**tipo_infracao_id** | **string** |  | [optional] [default to undefined]
**updated_at** | **string** |  | [optional] [default to undefined]
**valor** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { ModelInfraction } from './api';

const instance: ModelInfraction = {
    created_at,
    fotografias,
    id,
    infractors,
    lat,
    _long,
    material,
    material_id,
    occurrence_id,
    quantidade,
    sector_infracao,
    sector_infracao_id,
    tipo_infracao,
    tipo_infracao_id,
    updated_at,
    valor,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
