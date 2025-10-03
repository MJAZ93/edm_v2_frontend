# ReportsApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateReportsExecutePost**](#privatereportsexecutepost) | **POST** /private/reports/execute | Executar relatório mensal|
|[**privateReportsExportGet**](#privatereportsexportget) | **GET** /private/reports/export | Exportar relatório CSV|

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

let entity: string; //asc|regiao|occurrences|infractions|infractors|accoes (default to undefined)
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
| **entity** | [**string**] | asc|regiao|occurrences|infractions|infractors|accoes | defaults to undefined|
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

