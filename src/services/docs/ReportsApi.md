# ReportsApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateReportsExecutePost**](#privatereportsexecutepost) | **POST** /private/reports/execute | Executar relatório mensal|
|[**privateReportsExportGet**](#privatereportsexportget) | **GET** /private/reports/export | Exportar relatório CSV|
|[**privateReportsInstalacaoAccoesContagensGet**](#privatereportsinstalacaoaccoescontagensget) | **GET** /private/reports/instalacao-accoes/contagens | Contagens de ações por instalação|
|[**privateReportsInstalacaoAccoesMelhoresGet**](#privatereportsinstalacaoaccoesmelhoresget) | **GET** /private/reports/instalacao-accoes/melhores | Melhores grupos por valor recuperado|
|[**privateReportsInstalacaoAccoesTemporalGet**](#privatereportsinstalacaoaccoestemporalget) | **GET** /private/reports/instalacao-accoes/temporal | Análise temporal de ações|
|[**privateReportsInstalacaoAccoesValorRecuperadoGet**](#privatereportsinstalacaoaccoesvalorrecuperadoget) | **GET** /private/reports/instalacao-accoes/valor_recuperado | Valor recuperado|
|[**privateReportsInstalacoesContagensGet**](#privatereportsinstalacoescontagensget) | **GET** /private/reports/instalacoes/contagens | Contagens de instalações|
|[**privateReportsInstalacoesDeficitGet**](#privatereportsinstalacoesdeficitget) | **GET** /private/reports/instalacoes/deficit | Défice total|
|[**privateReportsInstalacoesTemporalGet**](#privatereportsinstalacoestemporalget) | **GET** /private/reports/instalacoes/temporal | Análise temporal|

# **privateReportsExecutePost**
> InoutOkResponse privateReportsExecutePost()

Dispara o envio do relatório mensal de vandalizações para todos os utilizadores conforme o seu âmbito

### Example

```typescript
import {
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateReportsExecutePost(
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**InoutOkResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateReportsExportGet**
> File privateReportsExportGet()

Exporta dados em CSV para as entidades suportadas

### Example

```typescript
import {
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

let entity: string; //asc|regiao|occurrences|infractions|infractors|accoes|installations|instalacao_accoes (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let dateStart: string; //RFC3339 start date (optional) (default to undefined)
let dateEnd: string; //RFC3339 end date (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao (optional) (default to undefined)
let ascId: string; //Filter by ASC (optional) (default to undefined)

const { status, data } = await apiInstance.privateReportsExportGet(
    entity,
    authorization,
    dateStart,
    dateEnd,
    regiaoId,
    ascId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **entity** | [**string**] | asc|regiao|occurrences|infractions|infractors|accoes|installations|instalacao_accoes | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **dateStart** | [**string**] | RFC3339 start date | (optional) defaults to undefined|
| **dateEnd** | [**string**] | RFC3339 end date | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao | (optional) defaults to undefined|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|


### Return type

**File**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: text/csv


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | CSV file |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateReportsInstalacaoAccoesContagensGet**
> ReportInstalacaoAccoesCountsResponse privateReportsInstalacaoAccoesContagensGet()

Totais de ações por grupo (regiao|pt). Filtros por tendência, marcação e análise.

### Example

```typescript
import {
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let groupBy: string; //regiao|pt (optional) (default to 'regiao')
let tendenciaCompras: string; //CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS (optional) (default to undefined)
let marcacaoStatus: string; //EXECUTADO|MARCADO (optional) (default to undefined)
let analiseStatus: string; //EM_ANALISE|ANALISADO (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao ID (optional) (default to undefined)
let ptId: string; //Filter by PT ID (optional) (default to undefined)

const { status, data } = await apiInstance.privateReportsInstalacaoAccoesContagensGet(
    authorization,
    groupBy,
    tendenciaCompras,
    marcacaoStatus,
    analiseStatus,
    regiaoId,
    ptId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **groupBy** | [**string**] | regiao|pt | (optional) defaults to 'regiao'|
| **tendenciaCompras** | [**string**] | CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS | (optional) defaults to undefined|
| **marcacaoStatus** | [**string**] | EXECUTADO|MARCADO | (optional) defaults to undefined|
| **analiseStatus** | [**string**] | EM_ANALISE|ANALISADO | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao ID | (optional) defaults to undefined|
| **ptId** | [**string**] | Filter by PT ID | (optional) defaults to undefined|


### Return type

**ReportInstalacaoAccoesCountsResponse**

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

# **privateReportsInstalacaoAccoesMelhoresGet**
> ReportInstalacaoAccoesValueResponse privateReportsInstalacaoAccoesMelhoresGet()

Top grupos (regiao|pt) por valor recuperado.

### Example

```typescript
import {
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let groupBy: string; //regiao|pt (optional) (default to 'regiao')
let limit: number; //Número máximo de grupos (optional) (default to 5)
let tendenciaCompras: string; //CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS (optional) (default to undefined)
let marcacaoStatus: string; //EXECUTADO|MARCADO (optional) (default to undefined)
let analiseStatus: string; //EM_ANALISE|ANALISADO (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao ID (optional) (default to undefined)
let ptId: string; //Filter by PT ID (optional) (default to undefined)

const { status, data } = await apiInstance.privateReportsInstalacaoAccoesMelhoresGet(
    authorization,
    groupBy,
    limit,
    tendenciaCompras,
    marcacaoStatus,
    analiseStatus,
    regiaoId,
    ptId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **groupBy** | [**string**] | regiao|pt | (optional) defaults to 'regiao'|
| **limit** | [**number**] | Número máximo de grupos | (optional) defaults to 5|
| **tendenciaCompras** | [**string**] | CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS | (optional) defaults to undefined|
| **marcacaoStatus** | [**string**] | EXECUTADO|MARCADO | (optional) defaults to undefined|
| **analiseStatus** | [**string**] | EM_ANALISE|ANALISADO | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao ID | (optional) defaults to undefined|
| **ptId** | [**string**] | Filter by PT ID | (optional) defaults to undefined|


### Return type

**ReportInstalacaoAccoesValueResponse**

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

# **privateReportsInstalacaoAccoesTemporalGet**
> ReportInstalacaoAccoesTemporalResponse privateReportsInstalacaoAccoesTemporalGet()

Contagem e valor recuperado por mês nos últimos X meses. Filtros por tendência, marcação e análise.

### Example

```typescript
import {
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let months: number; //Número de meses anteriores (optional) (default to 6)
let tendenciaCompras: string; //CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS (optional) (default to undefined)
let marcacaoStatus: string; //EXECUTADO|MARCADO (optional) (default to undefined)
let analiseStatus: string; //EM_ANALISE|ANALISADO (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao ID (optional) (default to undefined)
let ptId: string; //Filter by PT ID (optional) (default to undefined)

const { status, data } = await apiInstance.privateReportsInstalacaoAccoesTemporalGet(
    authorization,
    months,
    tendenciaCompras,
    marcacaoStatus,
    analiseStatus,
    regiaoId,
    ptId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **months** | [**number**] | Número de meses anteriores | (optional) defaults to 6|
| **tendenciaCompras** | [**string**] | CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS | (optional) defaults to undefined|
| **marcacaoStatus** | [**string**] | EXECUTADO|MARCADO | (optional) defaults to undefined|
| **analiseStatus** | [**string**] | EM_ANALISE|ANALISADO | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao ID | (optional) defaults to undefined|
| **ptId** | [**string**] | Filter by PT ID | (optional) defaults to undefined|


### Return type

**ReportInstalacaoAccoesTemporalResponse**

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

# **privateReportsInstalacaoAccoesValorRecuperadoGet**
> ReportInstalacaoAccoesValueResponse privateReportsInstalacaoAccoesValorRecuperadoGet()

Soma de (compras_6_antes - compras_6_depois) para ações finalizadas, agrupado por regiao|pt. Filtros por tendência, marcação e análise.

### Example

```typescript
import {
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let groupBy: string; //regiao|pt (optional) (default to 'regiao')
let tendenciaCompras: string; //CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS (optional) (default to undefined)
let marcacaoStatus: string; //EXECUTADO|MARCADO (optional) (default to undefined)
let analiseStatus: string; //EM_ANALISE|ANALISADO (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao ID (optional) (default to undefined)
let ptId: string; //Filter by PT ID (optional) (default to undefined)

const { status, data } = await apiInstance.privateReportsInstalacaoAccoesValorRecuperadoGet(
    authorization,
    groupBy,
    tendenciaCompras,
    marcacaoStatus,
    analiseStatus,
    regiaoId,
    ptId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **groupBy** | [**string**] | regiao|pt | (optional) defaults to 'regiao'|
| **tendenciaCompras** | [**string**] | CRESCENTE|DECRESCENTE|MUITO_CRESCENTE|MUITO_DECRESCENTE|NORMAL|SEM_COMPRAS | (optional) defaults to undefined|
| **marcacaoStatus** | [**string**] | EXECUTADO|MARCADO | (optional) defaults to undefined|
| **analiseStatus** | [**string**] | EM_ANALISE|ANALISADO | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao ID | (optional) defaults to undefined|
| **ptId** | [**string**] | Filter by PT ID | (optional) defaults to undefined|


### Return type

**ReportInstalacaoAccoesValueResponse**

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

# **privateReportsInstalacoesContagensGet**
> ReportInstalacoesCountsResponse privateReportsInstalacoesContagensGet()

Totais de inspeções por grupo (regiao|pt). Filtros opcionais.

### Example

```typescript
import {
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let groupBy: string; //regiao|pt (optional) (default to 'regiao')
let tendenciaCompras: string; //Filtrar por tendência (CRESCENTE, DECRESCENTE, MUITO_CRESCENTE, MUITO_DECRESCENTE, NORMAL, SEM_COMPRAS) (optional) (default to undefined)
let minScore: number; //Score mínimo (optional) (default to undefined)
let maxScore: number; //Score máximo (optional) (default to undefined)
let zeroComprasLast6: boolean; //Apenas com compras_6_meses = 0 (optional) (default to undefined)

const { status, data } = await apiInstance.privateReportsInstalacoesContagensGet(
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
| **groupBy** | [**string**] | regiao|pt | (optional) defaults to 'regiao'|
| **tendenciaCompras** | [**string**] | Filtrar por tendência (CRESCENTE, DECRESCENTE, MUITO_CRESCENTE, MUITO_DECRESCENTE, NORMAL, SEM_COMPRAS) | (optional) defaults to undefined|
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

# **privateReportsInstalacoesDeficitGet**
> ReportInstalacoesDeficitResponse privateReportsInstalacoesDeficitGet()

Diferença entre compras e equipamentos por grupo (regiao|pt). Filtros opcionais.

### Example

```typescript
import {
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let groupBy: string; //regiao|pt (optional) (default to 'regiao')
let tendenciaCompras: string; //Filtrar por tendência (CRESCENTE, DECRESCENTE, MUITO_CRESCENTE, MUITO_DECRESCENTE, NORMAL, SEM_COMPRAS) (optional) (default to undefined)
let minScore: number; //Score mínimo (optional) (default to undefined)
let maxScore: number; //Score máximo (optional) (default to undefined)

const { status, data } = await apiInstance.privateReportsInstalacoesDeficitGet(
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
| **tendenciaCompras** | [**string**] | Filtrar por tendência (CRESCENTE, DECRESCENTE, MUITO_CRESCENTE, MUITO_DECRESCENTE, NORMAL, SEM_COMPRAS) | (optional) defaults to undefined|
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

# **privateReportsInstalacoesTemporalGet**
> ReportInstalacoesTemporalResponse privateReportsInstalacoesTemporalGet()

Contagem e défice por mês nos últimos X meses. Filtros opcionais.

### Example

```typescript
import {
    ReportsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ReportsApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let months: number; //Número de meses anteriores (optional) (default to 6)
let tendenciaCompras: string; //Filtrar por tendência (CRESCENTE, DECRESCENTE, MUITO_CRESCENTE, MUITO_DECRESCENTE, NORMAL, SEM_COMPRAS) (optional) (default to undefined)
let minScore: number; //Score mínimo (optional) (default to undefined)
let maxScore: number; //Score máximo (optional) (default to undefined)
let zeroComprasLast6: boolean; //Apenas com compras_6_meses = 0 (optional) (default to undefined)

const { status, data } = await apiInstance.privateReportsInstalacoesTemporalGet(
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
| **tendenciaCompras** | [**string**] | Filtrar por tendência (CRESCENTE, DECRESCENTE, MUITO_CRESCENTE, MUITO_DECRESCENTE, NORMAL, SEM_COMPRAS) | (optional) defaults to undefined|
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

