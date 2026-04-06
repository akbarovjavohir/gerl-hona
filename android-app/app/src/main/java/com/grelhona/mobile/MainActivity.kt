package com.grelhona.mobile

import android.app.Application
import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Bundle
import android.net.wifi.WifiManager
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.BottomAppBar
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.logging.HttpLoggingInterceptor
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import okhttp3.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val factory = GrelViewModelFactory(application)
            val viewModel: GrelViewModel = viewModel(factory = factory)
            MaterialTheme {
                GrelApp(viewModel)
            }
        }
    }
}

enum class Screen(val title: String, val navLabel: String, val symbol: String) {
    DASHBOARD("Bosh sahifa", "Bosh", "B"),
    INVENTORY("Ombor", "Omb", "▣"),
    SALES("Savdo", "Sav", "◌"),
    EXPENSES("Harajatlar", "Xarj", "H"),
    DEBTS("Nasiyalar", "Nasiya", "N"),
    REPORTS("Hisobot", "Hisob", "∑")
}

data class InventoryItem(
    val id: String,
    val date: String,
    val quantity: Double,
    val costPerUnit: Double,
    val type: String = "grel"
)

data class SaleLineItem(
    val name: String,
    val quantity: Double,
    val price: Double
)

data class SaleItem(
    val id: String,
    val timestamp: String,
    val total: Double,
    val items: List<SaleLineItem>
)

data class ExpenseItem(
    val id: String,
    val date: String,
    val description: String,
    val amount: Double,
    val type: String = "operating"
)

data class SupplyPaymentItem(
    val id: String,
    val date: String,
    val amount: Double,
    val description: String
)

data class DebtItem(
    val id: String,
    val name: String,
    val amount: Double,
    val description: String?,
    val date: String,
    val quantity: Double = 0.0
)

data class DataPayload(
    val inventory: List<InventoryItem> = emptyList(),
    val sales: List<SaleItem> = emptyList(),
    val expenses: List<ExpenseItem> = emptyList(),
    val supplyPayments: List<SupplyPaymentItem> = emptyList(),
    val debts: List<DebtItem> = emptyList()
)

data class DataResponse(
    val message: String,
    val data: DataPayload
)

data class InventoryRequest(
    val id: String,
    val date: String,
    val quantity: Double,
    val costPerUnit: Double,
    val type: String = "grel"
)

data class SaleRequest(
    val id: String,
    val timestamp: String,
    val total: Double,
    val items: List<SaleLineItem>
)

data class ExpenseRequest(
    val id: String,
    val date: String,
    val description: String,
    val amount: Double,
    val type: String = "operating"
)

data class DebtRequest(
    val id: String,
    val name: String,
    val amount: Double,
    val description: String?,
    val date: String,
    val quantity: Double
)

interface GrelApi {
    @GET("data")
    suspend fun getData(): DataResponse

    @POST("inventory")
    suspend fun addInventory(@Body item: InventoryRequest)

    @DELETE("inventory/{id}")
    suspend fun deleteInventory(@Path("id") id: String)

    @POST("sales")
    suspend fun addSale(@Body sale: SaleRequest)

    @DELETE("sales/{id}")
    suspend fun deleteSale(@Path("id") id: String)

    @POST("expenses")
    suspend fun addExpense(@Body expense: ExpenseRequest)

    @DELETE("expenses/{id}")
    suspend fun deleteExpense(@Path("id") id: String)

    @POST("debts")
    suspend fun addDebt(@Body debt: DebtRequest)

    @DELETE("debts/{id}")
    suspend fun deleteDebt(@Path("id") id: String)
}

class GrelRepository {
    private val client: OkHttpClient
    private val eventsClient: OkHttpClient

    init {
        val logger = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        }
        client = OkHttpClient.Builder()
            .addInterceptor(logger)
            .build()
        eventsClient = client.newBuilder()
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .build()
    }

    private fun createApi(baseUrl: String): GrelApi {
        return Retrofit.Builder()
            .baseUrl(normalizeApiBaseUrl(baseUrl))
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(GrelApi::class.java)
    }

    suspend fun getData(baseUrl: String) = createApi(baseUrl).getData().data
    suspend fun addInventory(baseUrl: String, item: InventoryRequest) = createApi(baseUrl).addInventory(item)
    suspend fun deleteInventory(baseUrl: String, id: String) = createApi(baseUrl).deleteInventory(id)
    suspend fun addSale(baseUrl: String, item: SaleRequest) = createApi(baseUrl).addSale(item)
    suspend fun deleteSale(baseUrl: String, id: String) = createApi(baseUrl).deleteSale(id)
    suspend fun addExpense(baseUrl: String, item: ExpenseRequest) = createApi(baseUrl).addExpense(item)
    suspend fun deleteExpense(baseUrl: String, id: String) = createApi(baseUrl).deleteExpense(id)
    suspend fun addDebt(baseUrl: String, item: DebtRequest) = createApi(baseUrl).addDebt(item)
    suspend fun deleteDebt(baseUrl: String, id: String) = createApi(baseUrl).deleteDebt(id)

    fun openEvents(baseUrl: String, listener: EventSourceListener): EventSource {
        val request = Request.Builder()
            .url("${normalizeApiBaseUrl(baseUrl)}events")
            .build()
        return EventSources.createFactory(eventsClient).newEventSource(request, listener)
    }
}

data class UiState(
    val inventory: List<InventoryItem> = emptyList(),
    val sales: List<SaleItem> = emptyList(),
    val expenses: List<ExpenseItem> = emptyList(),
    val supplyPayments: List<SupplyPaymentItem> = emptyList(),
    val debts: List<DebtItem> = emptyList(),
    val apiBaseUrl: String = BuildConfig.API_BASE_URL,
    val serverStatus: String = "Qidirilmoqda",
    val isLoading: Boolean = true,
    val error: String? = null,
    val currentScreen: Screen = Screen.DASHBOARD
)

class GrelViewModel(
    application: Application,
    private val repository: GrelRepository
) : AndroidViewModel(application) {
    var uiState by mutableStateOf(UiState())
        private set
    private var eventsConnection: EventSource? = null
    private val prefs = application.getSharedPreferences("grel_hona_settings", Context.MODE_PRIVATE)
    private val discoveryManager = ServiceDiscoveryManager(
        context = application.applicationContext,
        onResolved = { resolvedUrl ->
            viewModelScope.launch {
                applyServerUrl(resolvedUrl, "Avtomatik topildi")
            }
        },
        onStatus = { status ->
            viewModelScope.launch {
                uiState = uiState.copy(serverStatus = status)
            }
        }
    )

    init {
        val savedUrl = prefs.getString("api_base_url", BuildConfig.API_BASE_URL) ?: BuildConfig.API_BASE_URL
        uiState = uiState.copy(apiBaseUrl = normalizeApiBaseUrl(savedUrl), serverStatus = "Ulanmoqda")
        refresh()
        connectRealtimeUpdates()
        discoveryManager.start()
    }

    fun setScreen(screen: Screen) {
        uiState = uiState.copy(currentScreen = screen)
    }

    fun refresh(showLoading: Boolean = true) {
        viewModelScope.launch {
            if (showLoading) {
                uiState = uiState.copy(isLoading = true, error = null)
            }
            val baseUrl = uiState.apiBaseUrl
            runCatching { withContext(Dispatchers.IO) { repository.getData(baseUrl) } }
                .onSuccess { payload ->
                    uiState = uiState.copy(
                        inventory = payload.inventory,
                        sales = payload.sales,
                        expenses = payload.expenses,
                        supplyPayments = payload.supplyPayments,
                        debts = payload.debts,
                        isLoading = false,
                        serverStatus = "Ulangan"
                    )
                }
                .onFailure { error ->
                    uiState = uiState.copy(
                        isLoading = false,
                        error = error.message ?: "Server bilan aloqa yo'q",
                        serverStatus = "Server qidirilmoqda"
                    )
                    discoveryManager.start()
                }
        }
    }

    fun addInventory(quantity: Double, totalCost: Double, onDone: (String?) -> Unit) {
        val costPerUnit = if (quantity > 0) totalCost / quantity else 0.0
        val request = InventoryRequest(
            id = System.currentTimeMillis().toString(),
            date = isoNow(),
            quantity = quantity,
            costPerUnit = costPerUnit
        )
        perform(onDone) { baseUrl -> repository.addInventory(baseUrl, request) }
    }

    fun deleteInventory(id: String, onDone: (String?) -> Unit) {
        perform(onDone) { baseUrl -> repository.deleteInventory(baseUrl, id) }
    }

    fun addSale(quantity: Double, totalPrice: Double, onDone: (String?) -> Unit) {
        val unitPrice = if (quantity > 0) totalPrice / quantity else 0.0
        val request = SaleRequest(
            id = System.currentTimeMillis().toString(),
            timestamp = isoNow(),
            total = totalPrice,
            items = listOf(SaleLineItem(name = "Grill", quantity = quantity, price = unitPrice))
        )
        perform(onDone) { baseUrl -> repository.addSale(baseUrl, request) }
    }

    fun deleteSale(id: String, onDone: (String?) -> Unit) {
        perform(onDone) { baseUrl -> repository.deleteSale(baseUrl, id) }
    }

    fun addExpense(description: String, amount: Double, onDone: (String?) -> Unit) {
        val request = ExpenseRequest(
            id = System.currentTimeMillis().toString(),
            date = isoNow(),
            description = description,
            amount = amount
        )
        perform(onDone) { baseUrl -> repository.addExpense(baseUrl, request) }
    }

    fun deleteExpense(id: String, onDone: (String?) -> Unit) {
        perform(onDone) { baseUrl -> repository.deleteExpense(baseUrl, id) }
    }

    fun addDebt(name: String, quantity: Double, amount: Double, description: String, onDone: (String?) -> Unit) {
        val request = DebtRequest(
            id = System.currentTimeMillis().toString(),
            name = name,
            amount = amount,
            description = description.ifBlank { null },
            date = isoNow(),
            quantity = quantity
        )
        perform(onDone) { baseUrl -> repository.addDebt(baseUrl, request) }
    }

    fun deleteDebt(id: String, onDone: (String?) -> Unit) {
        perform(onDone) { baseUrl -> repository.deleteDebt(baseUrl, id) }
    }

    fun retryDiscovery() {
        uiState = uiState.copy(serverStatus = "Qayta qidirilmoqda")
        discoveryManager.start()
    }

    private fun perform(onDone: (String?) -> Unit, block: suspend (String) -> Unit) {
        viewModelScope.launch {
            val baseUrl = uiState.apiBaseUrl
            runCatching { withContext(Dispatchers.IO) { block(baseUrl) } }
                .onSuccess {
                    refresh(showLoading = false)
                    onDone(null)
                }
                .onFailure { error ->
                    onDone(error.message ?: "Xatolik yuz berdi")
                }
        }
    }

    private fun connectRealtimeUpdates() {
        eventsConnection?.cancel()
        val baseUrl = uiState.apiBaseUrl
        eventsConnection = repository.openEvents(baseUrl, object : EventSourceListener() {
            override fun onEvent(
                eventSource: EventSource,
                id: String?,
                type: String?,
                data: String
            ) {
                if (type == "data-changed" || type == "connected") {
                    viewModelScope.launch {
                        refresh(showLoading = false)
                    }
                }
            }

            override fun onFailure(
                eventSource: EventSource,
                t: Throwable?,
                response: Response?
            ) {
                viewModelScope.launch {
                    uiState = uiState.copy(
                        error = null,
                        serverStatus = "Realtime uzildi, qidirilmoqda"
                    )
                    discoveryManager.start()
                }
            }
        })
    }

    private fun applyServerUrl(baseUrl: String, status: String) {
        val normalizedUrl = normalizeApiBaseUrl(baseUrl)
        if (uiState.apiBaseUrl == normalizedUrl && uiState.serverStatus == "Ulangan") {
            return
        }

        prefs.edit().putString("api_base_url", normalizedUrl).apply()
        uiState = uiState.copy(apiBaseUrl = normalizedUrl, serverStatus = status, error = null)
        connectRealtimeUpdates()
        refresh(showLoading = false)
    }

    override fun onCleared() {
        eventsConnection?.cancel()
        discoveryManager.stop()
        super.onCleared()
    }
}

class GrelViewModelFactory(private val application: Application) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        @Suppress("UNCHECKED_CAST")
        return GrelViewModel(application, GrelRepository()) as T
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GrelApp(viewModel: GrelViewModel) {
    val state = viewModel.uiState
    val context = LocalContext.current

    LaunchedEffect(state.error) {
        state.error?.let { Toast.makeText(context, it, Toast.LENGTH_LONG).show() }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF0F172A),
                        Color(0xFF172033),
                        Color(0xFF261B2F)
                    )
                )
            )
    ) {
        AppBackdrop()

        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Transparent,
                        titleContentColor = Color.White,
                        actionIconContentColor = Color(0xFFFFD166)
                    ),
                    title = {
                        Column {
                            Text("Grel Hona", fontWeight = FontWeight.ExtraBold)
                            Text("Smart control panel", style = MaterialTheme.typography.bodySmall, color = Color(0xB3FFFFFF))
                        }
                    },
                    actions = {
                        TextButton(onClick = { viewModel.refresh() }) {
                            Text("Yangilash", color = Color(0xFFFFD166))
                        }
                    }
                )
            },
            bottomBar = {
                BottomAppBar(
                    containerColor = Color(0x3DFFFFFF),
                    tonalElevation = 0.dp,
                    modifier = Modifier
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .clip(RoundedCornerShape(28.dp))
                        .border(1.dp, Color(0x40FFFFFF), RoundedCornerShape(28.dp))
                ) {
                    Screen.entries.forEach { screen ->
                        val selected = state.currentScreen == screen
                        val scale by animateFloatAsState(
                            targetValue = if (selected) 1.08f else 1f,
                            animationSpec = tween(durationMillis = 280, easing = FastOutSlowInEasing),
                            label = "navScale"
                        )
                        NavigationBarItem(
                            selected = selected,
                            onClick = { viewModel.setScreen(screen) },
                            icon = {
                                Text(
                                    screen.symbol,
                                    modifier = Modifier,
                                    color = if (selected) Color(0xFF0F172A) else Color.White.copy(alpha = 0.72f)
                                )
                            },
                            label = {
                                Text(
                                    screen.navLabel,
                                    maxLines = 1,
                                    color = if (selected) Color(0xFF0F172A) else Color.White.copy(alpha = 0.72f)
                                )
                            },
                            modifier = Modifier
                                .graphicsLayer {
                                    scaleX = scale
                                    scaleY = scale
                                }
                                .clip(RoundedCornerShape(22.dp))
                                .background(if (selected) Color(0xFFFFD166) else Color.Transparent)
                        )
                    }
                }
            }
        ) { innerPadding ->
            if (state.isLoading) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator(color = Color(0xFFFFD166))
                }
                return@Scaffold
            }

            AnimatedContent(
                targetState = state.currentScreen,
                label = "screenAnimation"
            ) { screen ->
                when (screen) {
                    Screen.DASHBOARD -> DashboardScreen(state, innerPadding, viewModel)
                    Screen.INVENTORY -> InventoryScreen(state, innerPadding, viewModel)
                    Screen.SALES -> SalesScreen(state, innerPadding, viewModel)
                    Screen.EXPENSES -> ExpensesScreen(state, innerPadding, viewModel)
                    Screen.DEBTS -> DebtsScreen(state, innerPadding, viewModel)
                    Screen.REPORTS -> ReportsScreen(state, innerPadding)
                }
            }
        }
    }
}

@Composable
fun AppBackdrop() {
    val transition = rememberInfiniteTransition(label = "backdrop")
    val floatY by transition.animateFloat(
        initialValue = 0f,
        targetValue = 14f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 5200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "blobY"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .offset(y = floatY.dp)
    ) {
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .offset(x = 80.dp, y = (-20).dp)
                .width(180.dp)
                .height(180.dp)
                .clip(CircleShape)
                .background(Color(0x26FFD166))
                .blur(24.dp)
        )
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .offset(x = (-90).dp, y = 60.dp)
                .width(200.dp)
                .height(200.dp)
                .clip(CircleShape)
                .background(Color(0x224DD0E1))
                .blur(28.dp)
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .offset(x = 60.dp, y = 40.dp)
                .width(220.dp)
                .height(220.dp)
                .clip(CircleShape)
                .background(Color(0x24FF7A59))
                .blur(32.dp)
        )
    }
}

@Composable
fun DashboardScreen(state: UiState, innerPadding: PaddingValues, viewModel: GrelViewModel) {
    val stock = getStockSummary(state)
    val todaysSales = state.sales.filter { isToday(it.timestamp) }
    val revenue = todaysSales.sumOf { it.total }
    ScreenContainer(innerPadding) {
        FormCard("Server ulanishi") {
            Text(state.serverStatus, fontWeight = FontWeight.Bold)
            Text(state.apiBaseUrl, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
            Button(onClick = { viewModel.retryDiscovery() }) {
                Text("Qayta topish")
            }
        }
        SummaryCard("Omborda", "${prettyNumber(stock)} ta", Color(0xFF2E7D32))
        SummaryCard("Bugungi savdo", "${todaysSales.size} ta", Color(0xFFEF6C00))
        SummaryCard("Bugungi tushum", "${money(revenue)} so'm", Color(0xFF1565C0))
    }
}

@Composable
fun InventoryScreen(state: UiState, innerPadding: PaddingValues, viewModel: GrelViewModel) {
    val context = LocalContext.current
    var quantity by remember { mutableStateOf("") }
    var totalCost by remember { mutableStateOf("") }
    ScreenContainer(innerPadding) {
        SummaryCard("Jami kirim", "${prettyNumber(state.inventory.sumOf { it.quantity })} ta", Color(0xFFEF6C00))
        SummaryCard("Qarzdorlik", "${money(getSupplyDebt(state))} so'm", Color(0xFFC62828))
        FormCard("Kirim qo'shish") {
            NumberField("Soni", quantity) { quantity = it }
            NumberField("Jami summa", totalCost) { totalCost = it }
            Button(onClick = {
                val qty = quantity.toDoubleOrNull()
                val total = totalCost.toDoubleOrNull()
                if (qty == null || total == null || qty <= 0) {
                    Toast.makeText(context, "Qiymatlar noto'g'ri", Toast.LENGTH_SHORT).show()
                } else {
                    viewModel.addInventory(qty, total) { error ->
                        Toast.makeText(context, error ?: "Saqlandi", Toast.LENGTH_SHORT).show()
                    }
                    quantity = ""
                    totalCost = ""
                }
            }) {
                Text("Qo'shish")
            }
        }
        ListCard("So'nggi kirimlar") {
            state.inventory.sortedByDescending { it.date }.forEach { item ->
                RowItem(
                    title = "${prettyNumber(item.quantity)} ta",
                    subtitle = "${formatDate(item.date)} | ${money(item.costPerUnit)} so'm"
                ) {
                    TextButton(onClick = {
                        viewModel.deleteInventory(item.id) { error ->
                            Toast.makeText(context, error ?: "O'chirildi", Toast.LENGTH_SHORT).show()
                        }
                    }) {
                        Text("O'chirish")
                    }
                }
            }
        }
    }
}

@Composable
fun SalesScreen(state: UiState, innerPadding: PaddingValues, viewModel: GrelViewModel) {
    val context = LocalContext.current
    val stock = getStockSummary(state)
    var quantity by remember { mutableStateOf("1") }
    var totalPrice by remember { mutableStateOf("50000") }
    val todaysSales = state.sales.filter { isToday(it.timestamp) }.sortedByDescending { it.timestamp }
    ScreenContainer(innerPadding) {
        SummaryCard("Omborda", "${prettyNumber(stock)} ta", if (stock > 0) Color(0xFF2E7D32) else Color(0xFFC62828))
        SummaryCard("Bugungi tushum", "${money(todaysSales.sumOf { it.total })} so'm", Color(0xFF1565C0))
        FormCard("Yangi savdo") {
            NumberField("Soni", quantity) {
                quantity = it
                val parsed = it.toDoubleOrNull()
                if (parsed != null) {
                    totalPrice = parsed.times(50000).toInt().toString()
                }
            }
            NumberField("Jami narx", totalPrice) { totalPrice = it }
            Button(onClick = {
                val qty = quantity.toDoubleOrNull()
                val total = totalPrice.toDoubleOrNull()
                if (qty == null || total == null || qty <= 0 || qty > stock) {
                    Toast.makeText(context, "Ombor yoki qiymat noto'g'ri", Toast.LENGTH_SHORT).show()
                } else {
                    viewModel.addSale(qty, total) { error ->
                        Toast.makeText(context, error ?: "Sotildi", Toast.LENGTH_SHORT).show()
                    }
                    quantity = "1"
                    totalPrice = "50000"
                }
            }, enabled = stock > 0) {
                Text("Sotish")
            }
        }
        ListCard("Bugungi savdolar") {
            if (todaysSales.isEmpty()) {
                Text("Bugun hali savdo bo'lmadi")
            }
            todaysSales.forEach { sale ->
                val item = sale.items.firstOrNull()
                RowItem(
                    title = "${item?.name ?: "Grill"} - ${prettyNumber(item?.quantity ?: 0.0)} ta",
                    subtitle = "${formatTime(sale.timestamp)} | ${money(sale.total)} so'm"
                ) {
                    TextButton(onClick = {
                        viewModel.deleteSale(sale.id) { error ->
                            Toast.makeText(context, error ?: "O'chirildi", Toast.LENGTH_SHORT).show()
                        }
                    }) {
                        Text("O'chirish")
                    }
                }
            }
        }
    }
}

@Composable
fun ExpensesScreen(state: UiState, innerPadding: PaddingValues, viewModel: GrelViewModel) {
    val context = LocalContext.current
    var description by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    val grouped = buildDailyStats(state)
    ScreenContainer(innerPadding) {
        FormCard("Chiqim qo'shish") {
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Izoh") }
            )
            NumberField("Summa", amount) { amount = it }
            Button(onClick = {
                val parsed = amount.toDoubleOrNull()
                if (description.isBlank() || parsed == null) {
                    Toast.makeText(context, "Maydonlarni to'ldiring", Toast.LENGTH_SHORT).show()
                } else {
                    viewModel.addExpense(description, parsed) { error ->
                        Toast.makeText(context, error ?: "Saqlandi", Toast.LENGTH_SHORT).show()
                    }
                    description = ""
                    amount = ""
                }
            }) {
                Text("Qo'shish")
            }
        }
        ListCard("Kunlik hisob") {
            grouped.forEach { day ->
                val profit = day.revenue - day.expenses
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF7F2EA))
                ) {
                    Column(Modifier.padding(14.dp)) {
                        Text(day.date, fontWeight = FontWeight.Bold)
                        Text("Savdo: ${money(day.revenue)} so'm")
                        Text("Chiqim: ${money(day.expenses)} so'm")
                        Text("Foyda: ${money(profit)} so'm")
                        day.expenseItems.forEach { expense ->
                            RowItem(
                                title = expense.description,
                                subtitle = "${money(expense.amount)} so'm"
                            ) {
                                TextButton(onClick = {
                                    viewModel.deleteExpense(expense.id) { error ->
                                        Toast.makeText(context, error ?: "O'chirildi", Toast.LENGTH_SHORT).show()
                                    }
                                }) {
                                    Text("O'chirish")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DebtsScreen(state: UiState, innerPadding: PaddingValues, viewModel: GrelViewModel) {
    val context = LocalContext.current
    val stock = getStockSummary(state)
    var name by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    ScreenContainer(innerPadding) {
        SummaryCard("Omborda", "${prettyNumber(stock)} ta", if (stock > 0) Color(0xFF2E7D32) else Color(0xFFC62828))
        SummaryCard("Jami nasiya", "${money(state.debts.sumOf { it.amount })} so'm", Color(0xFFC62828))
        FormCard("Nasiya qo'shish") {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Mijoz ismi") }
            )
            NumberField("Soni", quantity) { quantity = it }
            NumberField("Summa", amount) { amount = it }
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Izoh") }
            )
            Button(onClick = {
                val qty = quantity.toDoubleOrNull()
                val parsed = amount.toDoubleOrNull()
                if (name.isBlank() || parsed == null || qty == null || qty <= 0 || qty > stock) {
                    Toast.makeText(context, "Maydonlarni to'ldiring", Toast.LENGTH_SHORT).show()
                } else {
                    viewModel.addDebt(name, qty, parsed, description) { error ->
                        Toast.makeText(context, error ?: "Saqlandi", Toast.LENGTH_SHORT).show()
                    }
                    name = ""
                    quantity = ""
                    amount = ""
                    description = ""
                }
            }) {
                Text("Qo'shish")
            }
        }
        ListCard("Nasiyalar ro'yxati") {
            state.debts.sortedByDescending { it.date }.forEach { debt ->
                RowItem(
                    title = "${debt.name} - ${prettyNumber(debt.quantity)} ta - ${money(debt.amount)} so'm",
                    subtitle = "${formatDate(debt.date)} | ${debt.description ?: "-"}"
                ) {
                    TextButton(onClick = {
                        viewModel.deleteDebt(debt.id) { error ->
                            Toast.makeText(context, error ?: "To'landi", Toast.LENGTH_SHORT).show()
                        }
                    }) {
                        Text("To'landi")
                    }
                }
            }
        }
    }
}

@Composable
fun ReportsScreen(state: UiState, innerPadding: PaddingValues) {
    val totalCashSales = state.sales.sumOf { it.total }
    val totalDebtSales = state.debts.sumOf { it.amount }
    val totalSales = totalCashSales + totalDebtSales
    val totalInventoryCost = state.inventory.sumOf { it.quantity * it.costPerUnit }
    val totalExpenses = state.expenses.filter { it.type != "supply" }.sumOf { it.amount }
    val totalQty = state.inventory.sumOf { it.quantity }
    val averageCost = if (totalQty > 0) totalInventoryCost / totalQty else 0.0
    val totalCashQty = state.sales.sumOf { sale -> sale.items.sumOf { it.quantity } }
    val totalCashProfit = totalCashSales - (totalCashQty * averageCost) - totalExpenses
    val netProfit = totalSales - totalInventoryCost - totalExpenses
    val reportItems = buildReportRows(state)
    ScreenContainer(innerPadding) {
        SummaryCard("Naqd savdo", "${money(totalCashSales)} so'm", Color(0xFF2E7D32))
        SummaryCard("Naqd foyda", "${money(totalCashProfit)} so'm", if (totalCashProfit >= 0) Color(0xFF2E7D32) else Color(0xFFC62828))
        SummaryCard("Nasiya savdo", "${money(totalDebtSales)} so'm", Color(0xFFEF6C00))
        SummaryCard("Jami savdo", "${money(totalSales)} so'm", Color(0xFF1565C0))
        SummaryCard("Jami kirim", "${money(totalInventoryCost)} so'm", Color(0xFFC62828))
        SummaryCard("Qo'shimcha chiqim", "${money(totalExpenses)} so'm", Color(0xFF6A1B9A))
        SummaryCard("Sof foyda", "${money(netProfit)} so'm", if (netProfit >= 0) Color(0xFF2E7D32) else Color(0xFFC62828))
        ListCard("Kunlik hisobot") {
            reportItems.forEach { row ->
                RowItem(
                    title = "${row.date} | ${prettyNumber(row.count)} ta",
                    subtitle = "Naqd ${money(row.cashRevenue)} | Nasiya ${money(row.debtRevenue)} | Naqd foyda ${money(row.cashProfit)} | Foyda ${money(row.profit)}"
                )
            }
        }
    }
}

@Composable
fun ScreenContainer(innerPadding: PaddingValues, content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(innerPadding)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 12.dp)
            .padding(bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        content = content
    )
}

@Composable
fun SummaryCard(title: String, value: String, color: Color) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }
    val translateY by animateFloatAsState(
        targetValue = if (visible) 0f else 26f,
        animationSpec = tween(durationMillis = 650, easing = FastOutSlowInEasing),
        label = "summaryY"
    )
    val alpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0.35f,
        animationSpec = tween(durationMillis = 650, easing = FastOutSlowInEasing),
        label = "summaryAlpha"
    )
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .graphicsLayer {
                translationY = translateY
                this.alpha = alpha
            }
            .clip(RoundedCornerShape(28.dp))
            .border(1.dp, Color.White.copy(alpha = 0.10f), RoundedCornerShape(28.dp))
            .animateContentSize(),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Column(
            Modifier
                .background(
                    Brush.linearGradient(
                        colors = listOf(
                            color.copy(alpha = 0.42f),
                            Color.White.copy(alpha = 0.08f)
                        )
                    )
                )
                .padding(18.dp)
        ) {
            Text(title, color = Color.White.copy(alpha = 0.76f), style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.height(4.dp))
            AnimatedSummaryValue(value)
        }
    }
}

@Composable
fun FormCard(title: String, content: @Composable ColumnScope.() -> Unit) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }
    val translateY by animateFloatAsState(
        targetValue = if (visible) 0f else 34f,
        animationSpec = tween(durationMillis = 700, easing = FastOutSlowInEasing),
        label = "formY"
    )
    val alpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0.2f,
        animationSpec = tween(durationMillis = 700, easing = FastOutSlowInEasing),
        label = "formAlpha"
    )
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .graphicsLayer {
                translationY = translateY
                this.alpha = alpha
            }
            .clip(RoundedCornerShape(30.dp))
            .border(1.dp, Color(0x30FFFFFF), RoundedCornerShape(30.dp))
            .animateContentSize(),
        colors = CardDefaults.cardColors(containerColor = Color(0x22FFFFFF))
    ) {
        Column(
            Modifier
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color(0x22FFFFFF), Color(0x10FFFFFF))
                    )
                )
                .padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Color.White)
            content()
        }
    }
}

@Composable
fun ListCard(title: String, content: @Composable ColumnScope.() -> Unit) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }
    val translateY by animateFloatAsState(
        targetValue = if (visible) 0f else 44f,
        animationSpec = tween(durationMillis = 760, easing = FastOutSlowInEasing),
        label = "listY"
    )
    val alpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0.15f,
        animationSpec = tween(durationMillis = 760, easing = FastOutSlowInEasing),
        label = "listAlpha"
    )
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .graphicsLayer {
                translationY = translateY
                this.alpha = alpha
            }
            .clip(RoundedCornerShape(30.dp))
            .border(1.dp, Color(0x30FFFFFF), RoundedCornerShape(30.dp))
            .animateContentSize(),
        colors = CardDefaults.cardColors(containerColor = Color(0x18FFFFFF))
    ) {
        Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Color.White)
            content()
        }
    }
}

@Composable
fun NumberField(label: String, value: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier.fillMaxWidth(),
        label = { Text(label) },
        colors = TextFieldDefaults.colors(
            focusedContainerColor = Color(0x18FFFFFF),
            unfocusedContainerColor = Color(0x10FFFFFF),
            focusedTextColor = Color.White,
            unfocusedTextColor = Color.White,
            focusedLabelColor = Color(0xFFFFD166),
            unfocusedLabelColor = Color.White.copy(alpha = 0.65f),
            focusedIndicatorColor = Color(0xFFFFD166),
            unfocusedIndicatorColor = Color.White.copy(alpha = 0.24f),
            cursorColor = Color(0xFFFFD166)
        ),
        shape = RoundedCornerShape(18.dp)
    )
}

@Composable
fun RowItem(title: String, subtitle: String, trailing: @Composable (() -> Unit)? = null) {
    var visible by remember(title, subtitle) { mutableStateOf(false) }
    LaunchedEffect(title, subtitle) { visible = true }
    val translateX by animateFloatAsState(
        targetValue = if (visible) 0f else 28f,
        animationSpec = tween(durationMillis = 500, easing = FastOutSlowInEasing),
        label = "rowX"
    )
    val alpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0.2f,
        animationSpec = tween(durationMillis = 500, easing = FastOutSlowInEasing),
        label = "rowAlpha"
    )
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .graphicsLayer {
                translationX = translateX
                this.alpha = alpha
            }
            .clip(RoundedCornerShape(22.dp))
            .background(Color(0x14FFFFFF))
            .border(1.dp, Color(0x18FFFFFF), RoundedCornerShape(22.dp))
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.SemiBold, color = Color.White)
            Text(subtitle, style = MaterialTheme.typography.bodySmall, color = Color.White.copy(alpha = 0.62f))
        }
        if (trailing != null) {
            Spacer(Modifier.width(8.dp))
            trailing()
        }
    }
}

data class DailyExpenseStats(
    val date: String,
    val revenue: Double,
    val expenses: Double,
    val expenseItems: List<ExpenseItem>
)

data class ReportRow(
    val date: String,
    val count: Double,
    val cashRevenue: Double,
    val debtRevenue: Double,
    val revenue: Double,
    val expenses: Double,
    val cashProfit: Double,
    val profit: Double
)

fun buildDailyStats(state: UiState): List<DailyExpenseStats> {
    val expenseMap = linkedMapOf<String, MutableList<ExpenseItem>>()
    val revenueMap = linkedMapOf<String, Double>()

    state.sales.forEach { sale ->
        val key = formatDate(sale.timestamp)
        revenueMap[key] = (revenueMap[key] ?: 0.0) + sale.total
    }

    state.expenses.filter { it.type != "supply" }.forEach { expense ->
        val key = formatDate(expense.date)
        expenseMap.getOrPut(key) { mutableListOf() }.add(expense)
    }

    return (revenueMap.keys + expenseMap.keys).distinct().sortedByDescending { it }.map { date ->
        val expenses = expenseMap[date].orEmpty()
        DailyExpenseStats(
            date = date,
            revenue = revenueMap[date] ?: 0.0,
            expenses = expenses.sumOf { it.amount },
            expenseItems = expenses
        )
    }
}

fun buildReportRows(state: UiState): List<ReportRow> {
    val totalQty = state.inventory.sumOf { it.quantity }
    val averageCost = if (totalQty > 0) {
        state.inventory.sumOf { it.quantity * it.costPerUnit } / totalQty
    } else {
        0.0
    }

    val salesMap = linkedMapOf<String, Triple<Double, Double, Double>>()
    state.sales.forEach { sale ->
        val key = formatDate(sale.timestamp)
        val qty = sale.items.sumOf { it.quantity }
        val previous = salesMap[key] ?: Triple(0.0, 0.0, 0.0)
        salesMap[key] = Triple(previous.first + sale.total, previous.second + qty, 0.0)
    }

    val debtMap = linkedMapOf<String, Pair<Double, Double>>()
    state.debts.forEach { debt ->
        val key = formatDate(debt.date)
        val previous = debtMap[key] ?: (0.0 to 0.0)
        debtMap[key] = (previous.first + debt.amount) to (previous.second + debt.quantity)
    }

    val expensesMap = linkedMapOf<String, Double>()
    state.expenses.filter { it.type != "supply" }.forEach { expense ->
        val key = formatDate(expense.date)
        expensesMap[key] = (expensesMap[key] ?: 0.0) + expense.amount
    }

    return (salesMap.keys + debtMap.keys + expensesMap.keys).distinct().sortedByDescending { it }.map { date ->
        val cashRevenue = salesMap[date]?.first ?: 0.0
        val cashCount = salesMap[date]?.second ?: 0.0
        val debtRevenue = debtMap[date]?.first ?: 0.0
        val debtCount = debtMap[date]?.second ?: 0.0
        val revenue = cashRevenue + debtRevenue
        val count = cashCount + debtCount
        val expenses = expensesMap[date] ?: 0.0
        val cashProfit = cashRevenue - (cashCount * averageCost) - expenses
        val profit = revenue - (count * averageCost) - expenses
        ReportRow(date, count, cashRevenue, debtRevenue, revenue, expenses, cashProfit, profit)
    }
}

fun getStockSummary(state: UiState): Double {
    val totalIn = state.inventory.sumOf { it.quantity }
    val totalSold = state.sales.sumOf { sale -> sale.items.sumOf { it.quantity } }
    val totalDebtSold = state.debts.sumOf { it.quantity }
    return (totalIn - totalSold - totalDebtSold).coerceAtLeast(0.0)
}

fun getSupplyDebt(state: UiState): Double {
    val stockCost = state.inventory.sumOf { it.quantity * it.costPerUnit }
    val totalPayments = state.supplyPayments.sumOf { it.amount }
    return stockCost - totalPayments
}

fun isoNow(): String = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US).format(Date())

fun formatDate(value: String): String = runCatching {
    val parsed = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US).parse(value)
    SimpleDateFormat("dd.MM.yyyy", Locale.getDefault()).format(parsed ?: Date())
}.getOrDefault(value)

fun formatTime(value: String): String = runCatching {
    val parsed = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US).parse(value)
    SimpleDateFormat("HH:mm", Locale.getDefault()).format(parsed ?: Date())
}.getOrDefault(value)

fun isToday(value: String): Boolean =
    formatDate(value) == SimpleDateFormat("dd.MM.yyyy", Locale.getDefault()).format(Date())

fun prettyNumber(value: Double): String {
    return if (value % 1.0 == 0.0) value.toInt().toString() else value.toString()
}

fun money(value: Double): String = NumberFormat.getNumberInstance(Locale("uz", "UZ")).format(value)

@Composable
fun CountUpText(value: String) {
    var visible by remember(value) { mutableStateOf(false) }
    LaunchedEffect(value) { visible = true }
    val alpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0.45f,
        animationSpec = tween(durationMillis = 700, easing = FastOutSlowInEasing),
        label = "valueAlpha"
    )
    val translateY by animateFloatAsState(
        targetValue = if (visible) 0f else 14f,
        animationSpec = tween(durationMillis = 700, easing = FastOutSlowInEasing),
        label = "valueTranslate"
    )

    Text(
        text = value,
        modifier = Modifier.graphicsLayer {
            this.alpha = alpha
            translationY = translateY
        },
        style = MaterialTheme.typography.titleLarge,
        fontWeight = FontWeight.Bold,
        color = Color.White
    )
}

@Composable
fun AnimatedSummaryValue(value: String) {
    if (value.any { it.isDigit() }) {
        CountUpText(value)
    } else {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
    }
}

fun normalizeApiBaseUrl(value: String): String {
    var url = value.trim()
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "http://$url"
    }
    url = url.removeSuffix("/")
    if (!url.endsWith("/api")) {
        url += "/api"
    }
    return "$url/"
}

class ServiceDiscoveryManager(
    context: Context,
    private val onResolved: (String) -> Unit,
    private val onStatus: (String) -> Unit
) {
    private val appContext = context.applicationContext
    private val nsdManager = appContext.getSystemService(NsdManager::class.java)
    private val wifiManager = appContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
    private var multicastLock: WifiManager.MulticastLock? = null
    private var discoveryListener: NsdManager.DiscoveryListener? = null

    fun start() {
        stop()
        onStatus("Server qidirilmoqda")
        acquireMulticastLock()

        val listener = object : NsdManager.DiscoveryListener {
            override fun onDiscoveryStarted(serviceType: String) {
                onStatus("Server qidirilmoqda")
            }

            override fun onServiceFound(serviceInfo: NsdServiceInfo) {
                if (serviceInfo.serviceType != SERVICE_TYPE) return
                nsdManager?.resolveService(
                    serviceInfo,
                    object : NsdManager.ResolveListener {
                        override fun onServiceResolved(resolvedServiceInfo: NsdServiceInfo) {
                            val hostAddress = resolvedServiceInfo.host?.hostAddress ?: return
                            val normalizedHost = if (hostAddress.contains(":")) "[$hostAddress]" else hostAddress
                            onResolved("http://$normalizedHost:${resolvedServiceInfo.port}/api/")
                            onStatus("Server topildi")
                        }

                        override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
                            onStatus("Server qidirilmoqda")
                        }
                    }
                )
            }

            override fun onServiceLost(serviceInfo: NsdServiceInfo) {
                onStatus("Server yo'qoldi, qayta qidirilmoqda")
            }

            override fun onDiscoveryStopped(serviceType: String) = Unit

            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                onStatus("Qidiruv xatosi: $errorCode")
                stop()
            }

            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {
                stop()
            }
        }

        discoveryListener = listener
        nsdManager?.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, listener)
    }

    fun stop() {
        discoveryListener?.let { listener ->
            runCatching {
                nsdManager?.stopServiceDiscovery(listener)
            }
        }
        discoveryListener = null
        multicastLock?.takeIf { it.isHeld }?.release()
        multicastLock = null
    }

    private fun acquireMulticastLock() {
        if (multicastLock?.isHeld == true) return
        multicastLock = wifiManager.createMulticastLock("grel-hona-discovery").apply {
            setReferenceCounted(true)
            acquire()
        }
    }

    companion object {
        private const val SERVICE_TYPE = "_grelhona._tcp."
    }
}
