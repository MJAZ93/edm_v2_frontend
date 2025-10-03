# DashboardApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateDashboardFinanceCompareGet**](#privatedashboardfinancecompareget) | **GET** /private/dashboard/finance/compare | Finance compare|
|[**privateDashboardFinanceTimeseriesGet**](#privatedashboardfinancetimeseriesget) | **GET** /private/dashboard/finance/timeseries | Finance timeseries|
|[**privateDashboardFinanceTopGet**](#privatedashboardfinancetopget) | **GET** /private/dashboard/finance/top | Finance top ASCs|
|[**privateDashboardFinanceTotalsGet**](#privatedashboardfinancetotalsget) | **GET** /private/dashboard/finance/totals | Finance totals|
|[**privateDashboardGroupedGet**](#privatedashboardgroupedget) | **GET** /private/dashboard/grouped | Grouped counts|
|[**privateDashboardGroupedGet_0**](#privatedashboardgroupedget_0) | **GET** /private/dashboard/grouped | Grouped counts|
|[**privateDashboardInfractionsValueTimeseriesGet**](#privatedashboardinfractionsvaluetimeseriesget) | **GET** /private/dashboard/infractions/value/timeseries | Infractions value timeseries|
|[**privateDashboardKpisOverviewGet**](#privatedashboardkpisoverviewget) | **GET** /private/dashboard/kpis/overview | Overview KPIs|
|[**privateDashboardOccurrencesByAscGet**](#privatedashboardoccurrencesbyascget) | **GET** /private/dashboard/occurrences/by_asc | Grouped counts|
|[**privateDashboardOccurrencesByAscGet_0**](#privatedashboardoccurrencesbyascget_0) | **GET** /private/dashboard/occurrences/by_asc | Grouped counts|
|[**privateDashboardScrapyardsRiskTopGet**](#privatedashboardscrapyardsrisktopget) | **GET** /private/dashboard/scrapyards/risk/top | Top risky scrapyards|

# **privateDashboardFinanceCompareGet**
> DashboardFinanceCompare privateDashboardFinanceCompareGet()

Compare current window (months back from now) with previous window, for loss and spend

### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let months: number; //Months back window (optional) (default to 1)
let regiaoId: string; //Filter by Regiao (optional) (default to undefined)
let ascId: string; //Filter by ASC (optional) (default to undefined)

const { status, data } = await apiInstance.privateDashboardFinanceCompareGet(
    authorization,
    months,
    regiaoId,
    ascId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **months** | [**number**] | Months back window | (optional) defaults to 1|
| **regiaoId** | [**string**] | Filter by Regiao | (optional) defaults to undefined|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|


### Return type

**DashboardFinanceCompare**

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

# **privateDashboardFinanceTimeseriesGet**
> DashboardFinanceSeries privateDashboardFinanceTimeseriesGet()

Loss and spend time series

### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let dateStart: string; //RFC3339 start date (optional) (default to undefined)
let dateEnd: string; //RFC3339 end date (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao (optional) (default to undefined)
let ascId: string; //Filter by ASC (optional) (default to undefined)
let bucket: string; //day|week|month (optional) (default to 'week')

const { status, data } = await apiInstance.privateDashboardFinanceTimeseriesGet(
    authorization,
    dateStart,
    dateEnd,
    regiaoId,
    ascId,
    bucket
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **dateStart** | [**string**] | RFC3339 start date | (optional) defaults to undefined|
| **dateEnd** | [**string**] | RFC3339 end date | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao | (optional) defaults to undefined|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|
| **bucket** | [**string**] | day|week|month | (optional) defaults to 'week'|


### Return type

**DashboardFinanceSeries**

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

# **privateDashboardFinanceTopGet**
> DashboardFinanceTopList privateDashboardFinanceTopGet()

Top ASCs by loss or spend

### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let dateStart: string; //RFC3339 start date (optional) (default to undefined)
let dateEnd: string; //RFC3339 end date (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao (optional) (default to undefined)
let metric: string; //loss|spend (optional) (default to 'loss')
let limit: number; //Limit (optional) (default to 10)

const { status, data } = await apiInstance.privateDashboardFinanceTopGet(
    authorization,
    dateStart,
    dateEnd,
    regiaoId,
    metric,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **dateStart** | [**string**] | RFC3339 start date | (optional) defaults to undefined|
| **dateEnd** | [**string**] | RFC3339 end date | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao | (optional) defaults to undefined|
| **metric** | [**string**] | loss|spend | (optional) defaults to 'loss'|
| **limit** | [**number**] | Limit | (optional) defaults to 10|


### Return type

**DashboardFinanceTopList**

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

# **privateDashboardFinanceTotalsGet**
> DashboardFinanceTotals privateDashboardFinanceTotalsGet()

Loss total (infractions.valor) and actions spend total (accoes.amount), scoped by filters

### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let dateStart: string; //RFC3339 start date (optional) (default to undefined)
let dateEnd: string; //RFC3339 end date (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao (optional) (default to undefined)
let ascId: string; //Filter by ASC (optional) (default to undefined)

const { status, data } = await apiInstance.privateDashboardFinanceTotalsGet(
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
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **dateStart** | [**string**] | RFC3339 start date | (optional) defaults to undefined|
| **dateEnd** | [**string**] | RFC3339 end date | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao | (optional) defaults to undefined|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|


### Return type

**DashboardFinanceTotals**

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

# **privateDashboardGroupedGet**
> DashboardGroupedCountList privateDashboardGroupedGet()

Grouped counts for supported entities

### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let entity: string; //occurrences|infractions (default to undefined)
let groupBy: string; //For occurrences: asc|regiao. For infractions: tipo (default to undefined)
let authorization2: string; //Bearer token (default to undefined)
let dateStart: string; //RFC3339 start date (optional) (default to undefined)
let dateEnd: string; //RFC3339 end date (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao (optional) (default to undefined)
let ascId: string; //Filter by ASC (optional) (default to undefined)

const { status, data } = await apiInstance.privateDashboardGroupedGet(
    authorization,
    entity,
    groupBy,
    authorization2,
    dateStart,
    dateEnd,
    regiaoId,
    ascId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **entity** | [**string**] | occurrences|infractions | defaults to undefined|
| **groupBy** | [**string**] | For occurrences: asc|regiao. For infractions: tipo | defaults to undefined|
| **authorization2** | [**string**] | Bearer token | defaults to undefined|
| **dateStart** | [**string**] | RFC3339 start date | (optional) defaults to undefined|
| **dateEnd** | [**string**] | RFC3339 end date | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao | (optional) defaults to undefined|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|


### Return type

**DashboardGroupedCountList**

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

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateDashboardGroupedGet_0**
> DashboardGroupedCountList privateDashboardGroupedGet_0()

Grouped counts for supported entities

### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let entity: string; //occurrences|infractions (default to undefined)
let groupBy: string; //For occurrences: asc|regiao. For infractions: tipo (default to undefined)
let authorization2: string; //Bearer token (default to undefined)
let dateStart: string; //RFC3339 start date (optional) (default to undefined)
let dateEnd: string; //RFC3339 end date (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao (optional) (default to undefined)
let ascId: string; //Filter by ASC (optional) (default to undefined)

const { status, data } = await apiInstance.privateDashboardGroupedGet_0(
    authorization,
    entity,
    groupBy,
    authorization2,
    dateStart,
    dateEnd,
    regiaoId,
    ascId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **entity** | [**string**] | occurrences|infractions | defaults to undefined|
| **groupBy** | [**string**] | For occurrences: asc|regiao. For infractions: tipo | defaults to undefined|
| **authorization2** | [**string**] | Bearer token | defaults to undefined|
| **dateStart** | [**string**] | RFC3339 start date | (optional) defaults to undefined|
| **dateEnd** | [**string**] | RFC3339 end date | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao | (optional) defaults to undefined|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|


### Return type

**DashboardGroupedCountList**

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

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateDashboardInfractionsValueTimeseriesGet**
> DashboardTimeSeriesValue privateDashboardInfractionsValueTimeseriesGet()


### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let bucket: string; //day|week|month (optional) (default to 'week')

const { status, data } = await apiInstance.privateDashboardInfractionsValueTimeseriesGet(
    authorization,
    bucket
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **bucket** | [**string**] | day|week|month | (optional) defaults to 'week'|


### Return type

**DashboardTimeSeriesValue**

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

# **privateDashboardKpisOverviewGet**
> DashboardOverviewKPIs privateDashboardKpisOverviewGet()

High-level counters and totals

### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let dateStart: string; //RFC3339 start date (optional) (default to undefined)
let dateEnd: string; //RFC3339 end date (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao (optional) (default to undefined)
let ascId: string; //Filter by ASC (optional) (default to undefined)

const { status, data } = await apiInstance.privateDashboardKpisOverviewGet(
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
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **dateStart** | [**string**] | RFC3339 start date | (optional) defaults to undefined|
| **dateEnd** | [**string**] | RFC3339 end date | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao | (optional) defaults to undefined|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|


### Return type

**DashboardOverviewKPIs**

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

# **privateDashboardOccurrencesByAscGet**
> DashboardGroupedCountList privateDashboardOccurrencesByAscGet()

Grouped counts for supported entities

### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let entity: string; //occurrences|infractions (default to undefined)
let groupBy: string; //For occurrences: asc|regiao. For infractions: tipo (default to undefined)
let authorization2: string; //Bearer token (default to undefined)
let dateStart: string; //RFC3339 start date (optional) (default to undefined)
let dateEnd: string; //RFC3339 end date (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao (optional) (default to undefined)
let ascId: string; //Filter by ASC (optional) (default to undefined)

const { status, data } = await apiInstance.privateDashboardOccurrencesByAscGet(
    authorization,
    entity,
    groupBy,
    authorization2,
    dateStart,
    dateEnd,
    regiaoId,
    ascId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **entity** | [**string**] | occurrences|infractions | defaults to undefined|
| **groupBy** | [**string**] | For occurrences: asc|regiao. For infractions: tipo | defaults to undefined|
| **authorization2** | [**string**] | Bearer token | defaults to undefined|
| **dateStart** | [**string**] | RFC3339 start date | (optional) defaults to undefined|
| **dateEnd** | [**string**] | RFC3339 end date | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao | (optional) defaults to undefined|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|


### Return type

**DashboardGroupedCountList**

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

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateDashboardOccurrencesByAscGet_0**
> DashboardGroupedCountList privateDashboardOccurrencesByAscGet_0()

Grouped counts for supported entities

### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let entity: string; //occurrences|infractions (default to undefined)
let groupBy: string; //For occurrences: asc|regiao. For infractions: tipo (default to undefined)
let authorization2: string; //Bearer token (default to undefined)
let dateStart: string; //RFC3339 start date (optional) (default to undefined)
let dateEnd: string; //RFC3339 end date (optional) (default to undefined)
let regiaoId: string; //Filter by Regiao (optional) (default to undefined)
let ascId: string; //Filter by ASC (optional) (default to undefined)

const { status, data } = await apiInstance.privateDashboardOccurrencesByAscGet_0(
    authorization,
    entity,
    groupBy,
    authorization2,
    dateStart,
    dateEnd,
    regiaoId,
    ascId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **entity** | [**string**] | occurrences|infractions | defaults to undefined|
| **groupBy** | [**string**] | For occurrences: asc|regiao. For infractions: tipo | defaults to undefined|
| **authorization2** | [**string**] | Bearer token | defaults to undefined|
| **dateStart** | [**string**] | RFC3339 start date | (optional) defaults to undefined|
| **dateEnd** | [**string**] | RFC3339 end date | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by Regiao | (optional) defaults to undefined|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|


### Return type

**DashboardGroupedCountList**

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

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateDashboardScrapyardsRiskTopGet**
> DashboardScrapyardRiskTop privateDashboardScrapyardsRiskTopGet()


### Example

```typescript
import {
    DashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DashboardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let limit: number; //Limit (optional) (default to 10)

const { status, data } = await apiInstance.privateDashboardScrapyardsRiskTopGet(
    authorization,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **limit** | [**number**] | Limit | (optional) defaults to 10|


### Return type

**DashboardScrapyardRiskTop**

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

