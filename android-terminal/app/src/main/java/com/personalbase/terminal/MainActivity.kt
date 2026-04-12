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
import com.personalbase.terminal.ui.screens.CaptureScreen
import com.personalbase.terminal.ui.screens.CapsulesScreen
import com.personalbase.terminal.ui.screens.DockQueueScreen
import com.personalbase.terminal.ui.screens.SettingsScreen

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    background = Color(0xFF0F1115),
                    surface = Color(0xFF1A1D24),
                    onBackground = Color(0xFFA0A8B8),
                    onSurface = Color(0xFFE2E8F0),
                    primary = Color(0xFF3B82F6),
                    secondary = Color(0xFF10B981),
                    error = Color(0xFFEF4444)
                )
            ) {
                TerminalApp(viewModel)
            }
        }
    }
}

// ============================================================================
// NAVIGATION SEAM / 导航配置
// ============================================================================

enum class TerminalScreen(val label: String) {
    CAPTURE("采集"),
    QUEUE("待回港"),
    CAPSULES("胶囊"),
    SETTINGS("设置");
    
    val icon: ImageVector
        get() = when (this) {
            CAPTURE -> Icons.Default.Add
            QUEUE -> Icons.Default.Sync
            CAPSULES -> Icons.Default.Archive
            SETTINGS -> Icons.Default.Settings
        }
}

@Composable
fun TerminalApp(viewModel: MainViewModel) {
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
                    TerminalScreen.CAPSULES -> CapsulesScreen(viewModel = viewModel)
                    TerminalScreen.SETTINGS -> SettingsScreen(viewModel = viewModel)
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
        initialValue = 0.08f,
        targetValue = 0.18f,
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
                .padding(vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TerminalScreen.entries.forEach { screen ->
                val selected = currentScreen == screen
                
                // Use breathing alpha for active state background
                val bgAlpha = if (selected) breatheAlpha else 0f
                
                Surface(
                    modifier = Modifier
                        .clickable { onScreenSelected(screen) },
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primary.copy(alpha = bgAlpha)
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = screen.icon,
                            contentDescription = screen.label,
                            tint = if (selected) 
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.9f)
                            else 
                                MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f),
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            text = screen.label,
                            fontFamily = FontFamily.Monospace,
                            color = if (selected) 
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.9f) 
                            else 
                                MaterialTheme.colorScheme.onBackground.copy(alpha = 0.45f),
                            fontSize = 10.sp,
                            fontWeight = if (selected) FontWeight.Medium else FontWeight.Normal
                        )
                    }
                }
            }
        }
    }
}
