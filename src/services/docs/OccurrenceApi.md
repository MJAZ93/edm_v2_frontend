# OccurrenceApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateOccurrencesGet**](#privateoccurrencesget) | **GET** /private/occurrences | List Occurrences|
|[**privateOccurrencesIdDelete**](#privateoccurrencesiddelete) | **DELETE** /private/occurrences/{id} | Delete Occurrence|
|[**privateOccurrencesIdGet**](#privateoccurrencesidget) | **GET** /private/occurrences/{id} | Get Occurrence|
|[**privateOccurrencesIdPut**](#privateoccurrencesidput) | **PUT** /private/occurrences/{id} | Update Occurrence|
|[**privateOccurrencesPost**](#privateoccurrencespost) | **POST** /private/occurrences | Create Occurrence|

# **privateOccurrencesGet**
> OccurrenceOccurrenceListResponse privateOccurrencesGet()

Paginated list of occurrences

### Example

```typescript
import {
    OccurrenceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new OccurrenceApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'data_facto')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let regiaoId: string; //Filter by regiao (optional) (default to undefined)
let ascId: string; //Filter by asc (optional) (default to undefined)
let formaConhecimentoId: string; //Filter by forma_conhecimento (optional) (default to undefined)
let dataInicio: string; //Start date (RFC3339) (optional) (default to undefined)
let dataFim: string; //End date (RFC3339) (optional) (default to undefined)
let texto: string; //Free text search (optional) (default to undefined)

const { status, data } = await apiInstance.privateOccurrencesGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    regiaoId,
    ascId,
    formaConhecimentoId,
    dataInicio,
    dataFim,
    texto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **page** | [**number**] | Page number | (optional) defaults to undefined|
| **pageSize** | [**number**] | Page size | (optional) defaults to undefined|
| **orderBy** | [**string**] | Order by | (optional) defaults to 'data_facto'|
| **orderDirection** | [**string**] | asc|desc | (optional) defaults to 'asc'|
| **regiaoId** | [**string**] | Filter by regiao | (optional) defaults to undefined|
| **ascId** | [**string**] | Filter by asc | (optional) defaults to undefined|
| **formaConhecimentoId** | [**string**] | Filter by forma_conhecimento | (optional) defaults to undefined|
| **dataInicio** | [**string**] | Start date (RFC3339) | (optional) defaults to undefined|
| **dataFim** | [**string**] | End date (RFC3339) | (optional) defaults to undefined|
| **texto** | [**string**] | Free text search | (optional) defaults to undefined|


### Return type

**OccurrenceOccurrenceListResponse**

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

# **privateOccurrencesIdDelete**
> privateOccurrencesIdDelete()


### Example

```typescript
import {
    OccurrenceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new OccurrenceApi(configuration);

let id: string; //Occurrence ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateOccurrencesIdDelete(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Occurrence ID | defaults to undefined|
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

# **privateOccurrencesIdGet**
> ModelOccurrence privateOccurrencesIdGet()


### Example

```typescript
import {
    OccurrenceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new OccurrenceApi(configuration);

let id: string; //Occurrence ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateOccurrencesIdGet(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Occurrence ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelOccurrence**

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

# **privateOccurrencesIdPut**
> ModelOccurrence privateOccurrencesIdPut(payload)


### Example

```typescript
import {
    OccurrenceApi,
    Configuration,
    OccurrenceUpdateOccurrenceRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new OccurrenceApi(configuration);

let id: string; //Occurrence ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: OccurrenceUpdateOccurrenceRequest; //Occurrence payload

const { status, data } = await apiInstance.privateOccurrencesIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **OccurrenceUpdateOccurrenceRequest**| Occurrence payload | |
| **id** | [**string**] | Occurrence ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelOccurrence**

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

# **privateOccurrencesPost**
> ModelOccurrence privateOccurrencesPost(payload)

Create occurrence with optional nested infractions and infractors

### Example

```typescript
import {
    OccurrenceApi,
    Configuration,
    OccurrenceCreateOccurrenceRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new OccurrenceApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: OccurrenceCreateOccurrenceRequest; //Occurrence payload

const { status, data } = await apiInstance.privateOccurrencesPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **OccurrenceCreateOccurrenceRequest**| Occurrence payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelOccurrence**

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

