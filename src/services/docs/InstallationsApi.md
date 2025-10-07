# InstallationsApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateInstallationsExecuteMonthlyImportPost**](#privateinstallationsexecutemonthlyimportpost) | **POST** /private/installations/execute-monthly-import | Execute Monthly Import (Async)|
|[**privateInstallationsGet**](#privateinstallationsget) | **GET** /private/installations | List Installations|
|[**privateInstallationsPfDelete**](#privateinstallationspfdelete) | **DELETE** /private/installations/{pf} | Delete Installation|
|[**privateInstallationsPfGet**](#privateinstallationspfget) | **GET** /private/installations/{pf} | Get Installation|
|[**privateInstallationsPfPut**](#privateinstallationspfput) | **PUT** /private/installations/{pf} | Update Installation|
|[**privateInstallationsPost**](#privateinstallationspost) | **POST** /private/installations | Create Installation|

# **privateInstallationsExecuteMonthlyImportPost**
> InstallationMonthlyImportResponse privateInstallationsExecuteMonthlyImportPost()

Starts an asynchronous monthly import worker from INSP database to EDM database. Returns immediately with job ID. User receives email notification when complete. Processes data in 10k chunks and calculates neighbor compras.

### Example

```typescript
import {
    InstallationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InstallationsApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let maxRows: number; //Maximum number of rows to process (optional, processes all data if not specified) (optional) (default to undefined)

const { status, data } = await apiInstance.privateInstallationsExecuteMonthlyImportPost(
    authorization,
    maxRows
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **maxRows** | [**number**] | Maximum number of rows to process (optional, processes all data if not specified) | (optional) defaults to undefined|


### Return type

**InstallationMonthlyImportResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**202** | Job queued successfully |  -  |
|**401** | Unauthorized |  -  |
|**500** | Internal Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateInstallationsGet**
> InstallationInstallationListResponse privateInstallationsGet()

Paginated list of installations

### Example

```typescript
import {
    InstallationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InstallationsApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (-1 returns all) (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'mes')
let orderDirection: string; //asc|desc (optional) (default to 'desc')
let pf: string; //Filter by PF (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao ID (optional) (default to undefined)
let ascId: string; //Filter by ASC ID (optional) (default to undefined)
let ptId: string; //Filter by PT ID (optional) (default to undefined)
let semAccaoCorrente: boolean; //Apenas instalações sem ação corrente (EM_ANALISE no período de 6 meses) (optional) (default to undefined)
let nome: string; //Filter by Nome (optional) (default to undefined)
let tendenciaCompras: string; //Filter by Tendencia Compras (optional) (default to undefined)
let lat: number; //Reference latitude for proximity filter (optional) (default to undefined)
let lng: number; //Reference longitude for proximity filter (optional) (default to undefined)
let minScore: number; //Minimum Score (optional) (default to undefined)
let maxScore: number; //Maximum Score (optional) (default to undefined)
let minAiScore: number; //Minimum AI Score (optional) (default to undefined)
let maxAiScore: number; //Maximum AI Score (optional) (default to undefined)
let dateFrom: string; //Date from (YYYY-MM-DD) (optional) (default to undefined)
let dateTo: string; //Date to (YYYY-MM-DD) (optional) (default to undefined)

const { status, data } = await apiInstance.privateInstallationsGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    pf,
    regiaoId,
    ascId,
    ptId,
    semAccaoCorrente,
    nome,
    tendenciaCompras,
    lat,
    lng,
    minScore,
    maxScore,
    minAiScore,
    maxAiScore,
    dateFrom,
    dateTo
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **page** | [**number**] | Page number (-1 returns all) | (optional) defaults to undefined|
| **pageSize** | [**number**] | Page size | (optional) defaults to undefined|
| **orderBy** | [**string**] | Order by | (optional) defaults to 'mes'|
| **orderDirection** | [**string**] | asc|desc | (optional) defaults to 'desc'|
| **pf** | [**string**] | Filter by PF | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao ID | (optional) defaults to undefined|
| **ascId** | [**string**] | Filter by ASC ID | (optional) defaults to undefined|
| **ptId** | [**string**] | Filter by PT ID | (optional) defaults to undefined|
| **semAccaoCorrente** | [**boolean**] | Apenas instalações sem ação corrente (EM_ANALISE no período de 6 meses) | (optional) defaults to undefined|
| **nome** | [**string**] | Filter by Nome | (optional) defaults to undefined|
| **tendenciaCompras** | [**string**] | Filter by Tendencia Compras | (optional) defaults to undefined|
| **lat** | [**number**] | Reference latitude for proximity filter | (optional) defaults to undefined|
| **lng** | [**number**] | Reference longitude for proximity filter | (optional) defaults to undefined|
| **minScore** | [**number**] | Minimum Score | (optional) defaults to undefined|
| **maxScore** | [**number**] | Maximum Score | (optional) defaults to undefined|
| **minAiScore** | [**number**] | Minimum AI Score | (optional) defaults to undefined|
| **maxAiScore** | [**number**] | Maximum AI Score | (optional) defaults to undefined|
| **dateFrom** | [**string**] | Date from (YYYY-MM-DD) | (optional) defaults to undefined|
| **dateTo** | [**string**] | Date to (YYYY-MM-DD) | (optional) defaults to undefined|


### Return type

**InstallationInstallationListResponse**

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

# **privateInstallationsPfDelete**
> privateInstallationsPfDelete()


### Example

```typescript
import {
    InstallationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InstallationsApi(configuration);

let pf: string; //PF (default to undefined)
let mes: string; //Month (YYYY-MM-DD format) (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateInstallationsPfDelete(
    pf,
    mes,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pf** | [**string**] | PF | defaults to undefined|
| **mes** | [**string**] | Month (YYYY-MM-DD format) | defaults to undefined|
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

# **privateInstallationsPfGet**
> ModelInstallation privateInstallationsPfGet()


### Example

```typescript
import {
    InstallationsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InstallationsApi(configuration);

let pf: string; //PF (default to undefined)
let mes: string; //Month (YYYY-MM-DD format) (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateInstallationsPfGet(
    pf,
    mes,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pf** | [**string**] | PF | defaults to undefined|
| **mes** | [**string**] | Month (YYYY-MM-DD format) | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInstallation**

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

# **privateInstallationsPfPut**
> ModelInstallation privateInstallationsPfPut(installation)


### Example

```typescript
import {
    InstallationsApi,
    Configuration,
    InstallationInstallationUpdateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new InstallationsApi(configuration);

let pf: string; //PF (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let installation: InstallationInstallationUpdateRequest; //Installation data

const { status, data } = await apiInstance.privateInstallationsPfPut(
    pf,
    authorization,
    installation
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **installation** | **InstallationInstallationUpdateRequest**| Installation data | |
| **pf** | [**string**] | PF | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInstallation**

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

# **privateInstallationsPost**
> ModelInstallation privateInstallationsPost(installation)


### Example

```typescript
import {
    InstallationsApi,
    Configuration,
    InstallationInstallationCreateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new InstallationsApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let installation: InstallationInstallationCreateRequest; //Installation data

const { status, data } = await apiInstance.privateInstallationsPost(
    authorization,
    installation
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **installation** | **InstallationInstallationCreateRequest**| Installation data | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInstallation**

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

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

