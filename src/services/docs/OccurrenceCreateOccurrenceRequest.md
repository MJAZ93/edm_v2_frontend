# OccurrenceCreateOccurrenceRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**asc_id** | **string** |  | [optional] [default to undefined]
**data_facto** | **string** | Data do facto reportada pelo frontend (RFC3339). Se omitida, assume now(). | [optional] [default to undefined]
**descricao** | **string** |  | [optional] [default to undefined]
**direcao_transportes_id** | **string** |  | [optional] [default to undefined]
**forma_conhecimento_id** | **string** |  | [optional] [default to undefined]
**infractions** | [**Array&lt;OccurrenceCreateOccurrenceInfraction&gt;**](OccurrenceCreateOccurrenceInfraction.md) |  | [optional] [default to undefined]
**lat** | **number** |  | [optional] [default to undefined]
**local** | **string** |  | [optional] [default to undefined]
**_long** | **number** |  | [optional] [default to undefined]
**province_id** | **string** |  | [optional] [default to undefined]
**regiao_id** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { OccurrenceCreateOccurrenceRequest } from './api';

const instance: OccurrenceCreateOccurrenceRequest = {
    asc_id,
    data_facto,
    descricao,
    direcao_transportes_id,
    forma_conhecimento_id,
    infractions,
    lat,
    local,
    _long,
    province_id,
    regiao_id,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
