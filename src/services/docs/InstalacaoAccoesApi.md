# InstalacaoAccoesApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateInstalacaoAccoesExecuteMonthlyAnalisysPost**](#privateinstalacaoaccoesexecutemonthlyanalisyspost) | **POST** /private/instalacao-accoes/execute_monthly_analisys | Execute monthly analysis for running InstalacaoAccoes|
|[**privateInstalacaoAccoesGet**](#privateinstalacaoaccoesget) | **GET** /private/instalacao-accoes | List InstalacaoAccoes|
|[**privateInstalacaoAccoesIdDelete**](#privateinstalacaoaccoesiddelete) | **DELETE** /private/instalacao-accoes/{id} | Delete InstalacaoAccoes|
|[**privateInstalacaoAccoesIdGet**](#privateinstalacaoaccoesidget) | **GET** /private/instalacao-accoes/{id} | Get InstalacaoAccoes|
|[**privateInstalacaoAccoesIdPut**](#privateinstalacaoaccoesidput) | **PUT** /private/instalacao-accoes/{id} | Update InstalacaoAccoes|
|[**privateInstalacaoAccoesPost**](#privateinstalacaoaccoespost) | **POST** /private/instalacao-accoes | Create InstalacaoAccoes|

# **privateInstalacaoAccoesExecuteMonthlyAnalisysPost**
> InstalacaoAccoesExecuteMonthlyAnalysisResponse privateInstalacaoAccoesExecuteMonthlyAnalisysPost()

For each action in EM_ANALISE, within 6 months after data_execucao and not yet processed this month, updates compras_6_depois and tendencia_compras. On the last month, sets analise_status to ANALISADO.

### Example

```typescript
import {
    InstalacaoAccoesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InstalacaoAccoesApi(configuration);

let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateInstalacaoAccoesExecuteMonthlyAnalisysPost(
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**InstalacaoAccoesExecuteMonthlyAnalysisResponse**

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

# **privateInstalacaoAccoesGet**
> InstalacaoAccoesInstalacaoAccoesListResponse privateInstalacaoAccoesGet()

Paginated list of InstalacaoAccoes. MarcacaoStatus filter: EXECUTADO, MARCADO. AnaliseStatus filter: EM_ANALISE, ANALISADO. TendenciaCompras filter: CRESCENTE, DECRESCENTE, MUITO_CRESCENTE, MUITO_DECRESCENTE, NORMAL, SEM_COMPRAS

### Example

```typescript
import {
    InstalacaoAccoesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InstalacaoAccoesApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (-1 returns all) (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'data_execucao')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let pf: string; //Filter by installation PF (optional) (default to undefined)
let accaoTipoId: string; //Filter by action type ID (optional) (default to undefined)
let marcacaoStatus: string; //Filter by marking status (EXECUTADO, MARCADO) (optional) (default to undefined)
let analiseStatus: string; //Filter by analysis status (EM_ANALISE, ANALISADO) (optional) (default to undefined)
let tendenciaCompras: string; //Filter by purchase trend (CRESCENTE, DECRESCENTE, MUITO_CRESCENTE, MUITO_DECRESCENTE, NORMAL, SEM_COMPRAS) (optional) (default to undefined)

const { status, data } = await apiInstance.privateInstalacaoAccoesGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    pf,
    accaoTipoId,
    marcacaoStatus,
    analiseStatus,
    tendenciaCompras
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **page** | [**number**] | Page number (-1 returns all) | (optional) defaults to undefined|
| **pageSize** | [**number**] | Page size | (optional) defaults to undefined|
| **orderBy** | [**string**] | Order by | (optional) defaults to 'data_execucao'|
| **orderDirection** | [**string**] | asc|desc | (optional) defaults to 'asc'|
| **pf** | [**string**] | Filter by installation PF | (optional) defaults to undefined|
| **accaoTipoId** | [**string**] | Filter by action type ID | (optional) defaults to undefined|
| **marcacaoStatus** | [**string**] | Filter by marking status (EXECUTADO, MARCADO) | (optional) defaults to undefined|
| **analiseStatus** | [**string**] | Filter by analysis status (EM_ANALISE, ANALISADO) | (optional) defaults to undefined|
| **tendenciaCompras** | [**string**] | Filter by purchase trend (CRESCENTE, DECRESCENTE, MUITO_CRESCENTE, MUITO_DECRESCENTE, NORMAL, SEM_COMPRAS) | (optional) defaults to undefined|


### Return type

**InstalacaoAccoesInstalacaoAccoesListResponse**

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

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateInstalacaoAccoesIdDelete**
> privateInstalacaoAccoesIdDelete()


### Example

```typescript
import {
    InstalacaoAccoesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InstalacaoAccoesApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateInstalacaoAccoesIdDelete(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | No Content |  -  |
|**401** | Unauthorized |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateInstalacaoAccoesIdGet**
> ModelInstalacaoAccoes privateInstalacaoAccoesIdGet()


### Example

```typescript
import {
    InstalacaoAccoesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InstalacaoAccoesApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateInstalacaoAccoesIdGet(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInstalacaoAccoes**

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
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateInstalacaoAccoesIdPut**
> ModelInstalacaoAccoes privateInstalacaoAccoesIdPut(payload)

Update an installation action. MarcacaoStatus: EXECUTADO, MARCADO. AnaliseStatus: EM_ANALISE, ANALISADO. TendenciaCompras: CRESCENTE, DECRESCENTE, MUITO_CRESCENTE, MUITO_DECRESCENTE, NORMAL, SEM_COMPRAS

### Example

```typescript
import {
    InstalacaoAccoesApi,
    Configuration,
    InstalacaoAccoesUpdateInstalacaoAccoesRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new InstalacaoAccoesApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: InstalacaoAccoesUpdateInstalacaoAccoesRequest; //Payload

const { status, data } = await apiInstance.privateInstalacaoAccoesIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **InstalacaoAccoesUpdateInstalacaoAccoesRequest**| Payload | |
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInstalacaoAccoes**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateInstalacaoAccoesPost**
> ModelInstalacaoAccoes privateInstalacaoAccoesPost(payload)

Create a new installation action. MarcacaoStatus: EXECUTADO, MARCADO. AnaliseStatus: EM_ANALISE, ANALISADO. TendenciaCompras: CRESCENTE, DECRESCENTE, MUITO_CRESCENTE, MUITO_DECRESCENTE, NORMAL, SEM_COMPRAS

### Example

```typescript
import {
    InstalacaoAccoesApi,
    Configuration,
    InstalacaoAccoesCreateInstalacaoAccoesRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new InstalacaoAccoesApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: InstalacaoAccoesCreateInstalacaoAccoesRequest; //Payload

const { status, data } = await apiInstance.privateInstalacaoAccoesPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **InstalacaoAccoesCreateInstalacaoAccoesRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInstalacaoAccoes**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**409** | Conflict |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

