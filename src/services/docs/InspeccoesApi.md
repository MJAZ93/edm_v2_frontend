# InspeccoesApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateInspeccoesContagensGet**](#privateinspeccoescontagensget) | **GET** /private/inspeccoes/contagens | Contagens de inspeções|
|[**privateInspeccoesDeficitGet**](#privateinspeccoesdeficitget) | **GET** /private/inspeccoes/deficit | Défice total|
|[**privateInspeccoesTemporalGet**](#privateinspeccoestemporalget) | **GET** /private/inspeccoes/temporal | Análise temporal|

# **privateInspeccoesContagensGet**
> ReportInstalacoesCountsResponse privateInspeccoesContagensGet()

Totais de inspeções por grupo (regiao|pt). Filtros por tendência, score mínimo/máximo e zero compras 6 meses.

### Example

```typescript
import {
    InspeccoesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InspeccoesApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let groupBy: string; //regiao|pt|asc|tendencia (optional) (default to 'regiao')
let tendenciaCompras: string; //CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS (optional) (default to undefined)
let minScore: number; //Score mínimo (optional) (default to undefined)
let maxScore: number; //Score máximo (optional) (default to undefined)
let zeroComprasLast6: boolean; //Apenas com compras_6_meses = 0 (optional) (default to undefined)

const { status, data } = await apiInstance.privateInspeccoesContagensGet(
    authorization,
    groupBy,
    tendenciaCompras,
    minScore,
    maxScore,
    zeroComprasLast6
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **groupBy** | [**string**] | regiao|pt|asc|tendencia | (optional) defaults to 'regiao'|
| **tendenciaCompras** | [**string**] | CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS | (optional) defaults to undefined|
| **minScore** | [**number**] | Score mínimo | (optional) defaults to undefined|
| **maxScore** | [**number**] | Score máximo | (optional) defaults to undefined|
| **zeroComprasLast6** | [**boolean**] | Apenas com compras_6_meses &#x3D; 0 | (optional) defaults to undefined|


### Return type

**ReportInstalacoesCountsResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateInspeccoesDeficitGet**
> ReportInstalacoesDeficitResponse privateInspeccoesDeficitGet()

Diferença entre compras e equipamentos por grupo (regiao|pt). Filtros por tendência e score.

### Example

```typescript
import {
    InspeccoesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InspeccoesApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let groupBy: string; //regiao|pt (optional) (default to 'regiao')
let tendenciaCompras: string; //CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS (optional) (default to undefined)
let minScore: number; //Score mínimo (optional) (default to undefined)
let maxScore: number; //Score máximo (optional) (default to undefined)

const { status, data } = await apiInstance.privateInspeccoesDeficitGet(
    authorization,
    groupBy,
    tendenciaCompras,
    minScore,
    maxScore
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **groupBy** | [**string**] | regiao|pt | (optional) defaults to 'regiao'|
| **tendenciaCompras** | [**string**] | CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS | (optional) defaults to undefined|
| **minScore** | [**number**] | Score mínimo | (optional) defaults to undefined|
| **maxScore** | [**number**] | Score máximo | (optional) defaults to undefined|


### Return type

**ReportInstalacoesDeficitResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateInspeccoesTemporalGet**
> ReportInstalacoesTemporalResponse privateInspeccoesTemporalGet()

Contagem e défice por mês nos últimos X meses. Filtros por tendência, score e zero compras 6 meses.

### Example

```typescript
import {
    InspeccoesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InspeccoesApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let months: number; //Número de meses anteriores (optional) (default to 6)
let tendenciaCompras: string; //CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS (optional) (default to undefined)
let minScore: number; //Score mínimo (optional) (default to undefined)
let maxScore: number; //Score máximo (optional) (default to undefined)
let zeroComprasLast6: boolean; //Apenas com compras_6_meses = 0 (optional) (default to undefined)

const { status, data } = await apiInstance.privateInspeccoesTemporalGet(
    authorization,
    months,
    tendenciaCompras,
    minScore,
    maxScore,
    zeroComprasLast6
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **months** | [**number**] | Número de meses anteriores | (optional) defaults to 6|
| **tendenciaCompras** | [**string**] | CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS | (optional) defaults to undefined|
| **minScore** | [**number**] | Score mínimo | (optional) defaults to undefined|
| **maxScore** | [**number**] | Score máximo | (optional) defaults to undefined|
| **zeroComprasLast6** | [**boolean**] | Apenas com compras_6_meses &#x3D; 0 | (optional) defaults to undefined|


### Return type

**ReportInstalacoesTemporalResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

