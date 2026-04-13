package com.personalbase.terminal

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material.icons.filled.PlaylistAdd
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.personalbase.terminal.ui.MainViewModel
import com.personalbase.terminal.ui.createDynamicShapes
import com.personalbase.terminal.ui.screens.BaseMapScreen
import com.personalbase.terminal.ui.screens.CaptureScreen
import com.personalbase.terminal.ui.screens.CapsulesScreen
import com.personalbase.terminal.ui.screens.DockQueueScreen
import com.personalbase.terminal.ui.screens.PendingOrganizeScreen
import com.personalbase.terminal.ui.screens.SettingsScreen
import com.personalbase.terminal.ui.screens.TodosScreen
import com.personalbase.terminal.ui.screens.TrashScreen

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()
    
    var isDarkTheme by mutableStateOf(true)
        private set

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Load theme preference
        val prefs = getSharedPreferences("terminal_settings", MODE_PRIVATE)
        isDarkTheme = prefs.getBoolean("dark_theme", true)
        
        setContent {
            val primaryColor by viewModel.primaryColor.collectAsState()
            val secondaryColor by viewModel.secondaryColor.collectAsState()
            val borderRadius by viewModel.borderRadius.collectAsState()
            
            val colorScheme = if (isDarkTheme) {
                darkColorScheme(
                    background = Color(0xFF0F1115),
                    surface = Color(0xFF1A1D24),
                    onBackground = Color(0xFFA0A8B8),
                    onSurface = Color(0xFFE2E8F0),
                    primary = Color(primaryColor),
                    secondary = Color(secondaryColor),
                    error = Color(0xFFEF4444)
                )
            } else {
                lightColorScheme(
                    background = Color(0xFFF8FAFC),
                    surface = Color(0xFFFFFFFF),
                    onBackground = Color(0xFF1E293B),
                    onSurface = Color(0xFF334155),
                    primary = Color(primaryColor),
                    secondary = Color(secondaryColor),
                    error = Color(0xFFEF4444)
                )
            }
            
            val shapes = createDynamicShapes(borderRadius)
            
            MaterialTheme(
                colorScheme = colorScheme,
                shapes = shapes
            ) {
                TerminalApp(
                    viewModel = viewModel,
                    isDarkTheme = isDarkTheme,
                    onToggleTheme = { toggleTheme() }
                )
            }
        }
    }
    
    private fun toggleTheme() {
        isDarkTheme = !isDarkTheme
        // Persist theme preference
        getSharedPreferences("terminal_settings", MODE_PRIVATE)
            .edit()
            .putBoolean("dark_theme", isDarkTheme)
            .apply()
    }
}

// ============================================================================
// NAVIGATION SEAM / 导航配置
// ============================================================================

// Bottom navigation items - 5 core screens
enum class BottomNavItem(val label: String) {
    CAPTURE("采集"),
    QUEUE("待回港"),
    CAPSULES("胶囊"),
    TODOS("待办"),
    SETTINGS("设置");
    
    val icon: ImageVector
        get() = when (this) {
            CAPTURE -> Icons.Default.Add
            QUEUE -> Icons.Default.Sync
            CAPSULES -> Icons.Default.Archive
            TODOS -> Icons.Default.CheckCircle
            SETTINGS -> Icons.Default.Settings
        }
}

// All screens (for internal navigation)
enum class TerminalScreen(val label: String) {
    CAPTURE("采集"),
    QUEUE("待回港"),
    PENDING("待整理"),
    TODOS("待办"),
    CAPSULES("胶囊"),
    TRASH("回收站"),
    BASEMAP("基地地图"),
    SETTINGS("设置");
    
    val icon: ImageVector
        get() = when (this) {
            CAPTURE -> Icons.Default.Add
            QUEUE -> Icons.Default.Sync
            PENDING -> Icons.Default.PlaylistAdd
            TODOS -> Icons.Default.CheckCircle
            CAPSULES -> Icons.Default.Archive
            TRASH -> Icons.Default.Delete
            BASEMAP -> Icons.Default.Map
            SETTINGS -> Icons.Default.Settings
        }
}

@Composable
fun TerminalApp(
    viewModel: MainViewModel,
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    var currentScreen by remember { mutableStateOf(TerminalScreen.CAPTURE) }

    Scaffold(
        containerColor = Color(0xFF0F1115),
        bottomBar = {
            TerminalBottomNav(
                currentScreen = currentScreen,
                onScreenSelected = { currentScreen = it }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            AnimatedContent(
                targetState = currentScreen,
                transitionSpec = {
                    fadeIn(animationSpec = tween(300)) togetherWith
                    fadeOut(animationSpec = tween(300))
                },
                label = "screen_transition"
            ) { screen ->
                when (screen) {
                    TerminalScreen.CAPTURE -> CaptureScreen(viewModel = viewModel)
                    TerminalScreen.QUEUE -> DockQueueScreen(viewModel = viewModel)
                    TerminalScreen.PENDING -> PendingOrganizeScreen(viewModel = viewModel)
                    TerminalScreen.TODOS -> TodosScreen(viewModel = viewModel)
                    TerminalScreen.CAPSULES -> CapsulesScreen(
                        viewModel = viewModel,
                        onNavigateToTrash = { currentScreen = TerminalScreen.TRASH }
                    )
                    TerminalScreen.TRASH -> TrashScreen(
                        viewModel = viewModel,
                        onNavigateBack = { currentScreen = TerminalScreen.CAPSULES }
                    )
                    TerminalScreen.BASEMAP -> BaseMapScreen(viewModel = viewModel)
                    TerminalScreen.SETTINGS -> SettingsScreen(
                        viewModel = viewModel,
                        isDarkTheme = isDarkTheme,
                        onToggleTheme = onToggleTheme
                    )
                }
            }
        }
    }
}

@Composable
private fun TerminalBottomNav(
    currentScreen: TerminalScreen,
    onScreenSelected: (TerminalScreen) -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "nav_breathe")
    
    // Subtle breathing animation for active indicator
    val breatheAlpha by infiniteTransition.animateFloat(
        initialValue = 0.06f,
        targetValue = 0.14f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "breathe_alpha"
    )
    
    Surface(
        color = Color(0xFF1A1D24),
        tonalElevation = 4.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            BottomNavItem.entries.forEach { item ->
                // Map BottomNavItem to TerminalScreen
                val targetScreen = when (item) {
                    BottomNavItem.CAPTURE -> TerminalScreen.CAPTURE
                    BottomNavItem.QUEUE -> TerminalScreen.QUEUE
                    BottomNavItem.CAPSULES -> TerminalScreen.CAPSULES
                    BottomNavItem.TODOS -> TerminalScreen.TODOS
                    BottomNavItem.SETTINGS -> TerminalScreen.SETTINGS
                }
                val selected = currentScreen == targetScreen
                
                // Use breathing alpha for active state background
                val bgAlpha = if (selected) breatheAlpha else 0f
                
                Surface(
                    modifier = Modifier
                        .clickable { onScreenSelected(targetScreen) },
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primary.copy(alpha = bgAlpha)
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.label,
                            tint = if (selected) 
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.9f)
                            else 
                                MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = item.label,
                            fontFamily = FontFamily.Monospace,
                            color = if (selected) 
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.9f) 
                            else 
                                MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f),
                            fontSize = 9.sp,
                            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal
                        )
                    }
                }
            }
        }
    }
}
