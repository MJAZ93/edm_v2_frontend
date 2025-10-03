# InfractorApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateInfractorsGet**](#privateinfractorsget) | **GET** /private/infractors | List Infractors|
|[**privateInfractorsIdDelete**](#privateinfractorsiddelete) | **DELETE** /private/infractors/{id} | Delete Infractor|
|[**privateInfractorsIdGet**](#privateinfractorsidget) | **GET** /private/infractors/{id} | Get Infractor|
|[**privateInfractorsIdPut**](#privateinfractorsidput) | **PUT** /private/infractors/{id} | Update Infractor|
|[**privateInfractorsPost**](#privateinfractorspost) | **POST** /private/infractors | Create Infractor|

# **privateInfractorsGet**
> InfractorInfractorListResponse privateInfractorsGet()

Paginated list of infractors

### Example

```typescript
import {
    InfractorApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfractorApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let infractionId: string; //Filter by infraction (optional) (default to undefined)
let nome: string; //Filter by name (optional) (default to undefined)
let doc: string; //Filter by document (optional) (default to undefined)

const { status, data } = await apiInstance.privateInfractorsGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    infractionId,
    nome,
    doc
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **page** | [**number**] | Page number | (optional) defaults to undefined|
| **pageSize** | [**number**] | Page size | (optional) defaults to undefined|
| **orderBy** | [**string**] | Order by | (optional) defaults to 'id'|
| **orderDirection** | [**string**] | asc|desc | (optional) defaults to 'asc'|
| **infractionId** | [**string**] | Filter by infraction | (optional) defaults to undefined|
| **nome** | [**string**] | Filter by name | (optional) defaults to undefined|
| **doc** | [**string**] | Filter by document | (optional) defaults to undefined|


### Return type

**InfractorInfractorListResponse**

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

# **privateInfractorsIdDelete**
> privateInfractorsIdDelete()


### Example

```typescript
import {
    InfractorApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfractorApi(configuration);

let id: string; //Infractor ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateInfractorsIdDelete(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Infractor ID | defaults to undefined|
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

# **privateInfractorsIdGet**
> ModelInfractor privateInfractorsIdGet()


### Example

```typescript
import {
    InfractorApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InfractorApi(configuration);

let id: string; //Infractor ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateInfractorsIdGet(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Infractor ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInfractor**

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

# **privateInfractorsIdPut**
> ModelInfractor privateInfractorsIdPut(payload)


### Example

```typescript
import {
    InfractorApi,
    Configuration,
    InfractorUpdateInfractorRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new InfractorApi(configuration);

let id: string; //Infractor ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: InfractorUpdateInfractorRequest; //Payload

const { status, data } = await apiInstance.privateInfractorsIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **InfractorUpdateInfractorRequest**| Payload | |
| **id** | [**string**] | Infractor ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInfractor**

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

# **privateInfractorsPost**
> ModelInfractor privateInfractorsPost(payload)


### Example

```typescript
import {
    InfractorApi,
    Configuration,
    InfractorCreateInfractorRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new InfractorApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: InfractorCreateInfractorRequest; //Payload

const { status, data } = await apiInstance.privateInfractorsPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **InfractorCreateInfractorRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInfractor**

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

