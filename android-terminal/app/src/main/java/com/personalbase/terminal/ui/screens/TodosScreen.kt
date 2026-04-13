/**
 * TodosScreen - 待办事项屏幕
 * 
 * 屏幕功能：
 * - 显示所有待办事项（进行中/已完成）
 * - 支持创建新待办
 * - 支持标记完成/未完成
 * - 支持滑动删除
 * - 支持重要性星级评定
 * - 支持日历视图
 * 
 * 状态管理：
 * - activeTodos: ViewModel 中的进行中待办
 * - completedTodos: ViewModel 中的已完成待办
 * - selectedTab: 当前选中的标签页 (0=进行中, 1=已完成)
 * 
 * 用户交互：
 * - Tab 切换进行中/已完成
 * - FAB 创建新待办
 * - Checkbox 标记完成
 * - 滑动删除待办
 * - 重要性星级选择
 * - 日历/列表视图切换
 */
package com.personalbase.terminal.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.personalbase.terminal.data.TodoEntity
import com.personalbase.terminal.ui.MainViewModel
import androidx.compose.animation.core.tween
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun TodosScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val activeTodos by viewModel.activeTodos.collectAsState(initial = emptyList())
    val completedTodos by viewModel.completedTodos.collectAsState(initial = emptyList())
    
    var selectedTab by remember { mutableStateOf(0) } // 0 = Active, 1 = Completed
    var showCreateDialog by remember { mutableStateOf(false) }
    var newTodoTitle by remember { mutableStateOf("") }
    var newTodoImportance by remember { mutableIntStateOf(0) }
    
    // Calendar view state
    var showCalendarView by remember { mutableStateOf(false) }
    var selectedDate by remember { mutableLongStateOf(0L) }
    var currentMonth by remember { mutableStateOf(Calendar.getInstance()) }
    
    val displayTodos = if (selectedTab == 0) activeTodos else completedTodos
    
    // Filter todos by selected date if a date is selected
    val filteredTodos = if (selectedDate > 0) {
        val dateFormat = SimpleDateFormat("yyyyMMdd", Locale.getDefault())
        val selectedDateStr = dateFormat.format(Date(selectedDate))
        displayTodos.filter { todo ->
            todo.dueDate?.let { dueDate ->
                dateFormat.format(Date(dueDate)) == selectedDateStr
            } ?: false
        }
    } else {
        displayTodos
    }
    
    // Screen launch animation
    var screenVisible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(100)
        screenVisible = true
    }
    
    Box(modifier = modifier.fillMaxSize()) {
        AnimatedVisibility(
            visible = screenVisible,
            enter = fadeIn(tween(400)) + scaleIn(initialScale = 0.98f, animationSpec = tween(400))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "待办清单",
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    )
                    
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // View toggle button
                        IconButton(
                            onClick = { 
                                showCalendarView = !showCalendarView
                                if (!showCalendarView) selectedDate = 0L
                            }
                        ) {
                            Icon(
                                imageVector = if (showCalendarView) Icons.Default.List else Icons.Default.CalendarMonth,
                                contentDescription = if (showCalendarView) "列表视图" else "日历视图",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                        
                        Text(
                            text = "${activeTodos.size} 进行中",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.secondary,
                            fontSize = 14.sp
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                if (showCalendarView) {
                    // Calendar View
                    CalendarView(
                        todos = displayTodos,
                        selectedDate = selectedDate,
                        onDateSelected = { date ->
                            selectedDate = if (selectedDate == date) 0L else date
                        },
                        currentMonth = currentMonth,
                        onMonthChange = { offset ->
                            currentMonth = (currentMonth.clone() as Calendar).apply {
                                add(Calendar.MONTH, offset)
                            }
                        }
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Selected date filter indicator
                    if (selectedDate > 0) {
                        val dateFormat = SimpleDateFormat("yyyy年MM月dd日", Locale.getDefault())
                        Text(
                            text = "📅 ${dateFormat.format(Date(selectedDate))} 的待办",
                            fontFamily = FontFamily.Monospace,
                            color = MaterialTheme.colorScheme.secondary,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                    }
                } else {
                    // Tab Row
                    TabRow(
                        selectedTabIndex = selectedTab,
                        containerColor = MaterialTheme.colorScheme.surface,
                        contentColor = MaterialTheme.colorScheme.primary
                    ) {
                        Tab(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0 },
                            text = {
                                Text(
                                    text = "进行中 (${activeTodos.size})",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 14.sp
                                )
                            }
                        )
                        Tab(
                            selected = selectedTab == 1,
                            onClick = { selectedTab = 1 },
                            text = {
                                Text(
                                    text = "已完成 (${completedTodos.size})",
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 14.sp
                                )
                            }
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Todo List or Empty State or Calendar filtered results
                if (filteredTodos.isEmpty()) {
                    EmptyTodosState(
                        isActiveTab = selectedTab == 0,
                        modifier = Modifier.weight(1f)
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(filteredTodos, key = { it.id }) { todo ->
                            TodoItem(
                                todo = todo,
                                onToggle = { viewModel.toggleTodoCompleted(todo) },
                                onDelete = { viewModel.deleteTodo(todo) }
                            )
                        }
                    }
                }
            }
        }
        
        // FAB
        FloatingActionButton(
            onClick = { showCreateDialog = true },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp),
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = Color.White
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = "添加待办"
            )
        }
        
        // Create Dialog
        if (showCreateDialog) {
            CreateTodoDialog(
                title = newTodoTitle,
                onTitleChange = { newTodoTitle = it },
                importance = newTodoImportance,
                onImportanceChange = { newTodoImportance = it },
                onDismiss = {
                    showCreateDialog = false
                    newTodoTitle = ""
                    newTodoImportance = 0
                },
                onConfirm = {
                    if (newTodoTitle.isNotBlank()) {
                        viewModel.addTodo(title = newTodoTitle)
                        newTodoTitle = ""
                        newTodoImportance = 0
                        showCreateDialog = false
                    }
                }
            )
        }
    }
}

@Composable
private fun CalendarView(
    todos: List<TodoEntity>,
    selectedDate: Long,
    onDateSelected: (Long) -> Unit,
    currentMonth: Calendar,
    onMonthChange: (Int) -> Unit
) {
    val monthFormat = SimpleDateFormat("yyyy年 MM月", Locale.getDefault())
    
    // Get days in month
    val daysInMonth = remember(currentMonth) {
        val cal = currentMonth.clone() as Calendar
        cal.set(Calendar.DAY_OF_MONTH, 1)
        val firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK) - 1
        val daysCount = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
        Pair(firstDayOfWeek, daysCount)
    }
    
    // Count todos per day
    val todosPerDay = remember(todos) {
        val dateFormat = SimpleDateFormat("yyyyMMdd", Locale.getDefault())
        todos.mapNotNull { it.dueDate?.let { dueDate -> dateFormat.format(Date(dueDate)) } }
            .groupingBy { it }
            .eachCount()
    }
    
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Month navigation header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { onMonthChange(-1) }) {
                    Icon(
                        imageVector = Icons.Default.ChevronLeft,
                        contentDescription = "上个月",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                
                Text(
                    text = monthFormat.format(currentMonth.time),
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Medium,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                IconButton(onClick = { onMonthChange(1) }) {
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = "下个月",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Weekday headers
            Row(modifier = Modifier.fillMaxWidth()) {
                listOf("日", "一", "二", "三", "四", "五", "六").forEach { day ->
                    Text(
                        text = day,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Calendar grid
            val totalCells = daysInMonth.first + daysInMonth.second
            val rows = (totalCells + 6) / 7
            
            Column {
                for (week in 0 until rows) {
                    Row(modifier = Modifier.fillMaxWidth()) {
                        for (dayOfWeek in 0..6) {
                            val cellIndex = week * 7 + dayOfWeek
                            val dayNumber = cellIndex - daysInMonth.first + 1
                            
                            if (dayNumber in 1..daysInMonth.second) {
                                val cal = (currentMonth.clone() as Calendar).apply {
                                    set(Calendar.DAY_OF_MONTH, dayNumber)
                                    set(Calendar.HOUR_OF_DAY, 0)
                                    set(Calendar.MINUTE, 0)
                                    set(Calendar.SECOND, 0)
                                    set(Calendar.MILLISECOND, 0)
                                }
                                val dateTimestamp = cal.timeInMillis
                                val dateFormat = SimpleDateFormat("yyyyMMdd", Locale.getDefault())
                                val dateStr = dateFormat.format(cal.time)
                                val todoCount = todosPerDay[dateStr] ?: 0
                                val isSelected = selectedDate > 0 && dateFormat.format(Date(selectedDate)) == dateStr
                                val isToday = dateFormat.format(Date()).equals(dateStr)
                                
                                CalendarDay(
                                    dayNumber = dayNumber,
                                    todoCount = todoCount,
                                    isSelected = isSelected,
                                    isToday = isToday,
                                    onClick = { onDateSelected(dateTimestamp) },
                                    modifier = Modifier.weight(1f)
                                )
                            } else {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CalendarDay(
    dayNumber: Int,
    todoCount: Int,
    isSelected: Boolean,
    isToday: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .aspectRatio(1f)
            .padding(2.dp)
            .clip(CircleShape)
            .background(
                when {
                    isSelected -> MaterialTheme.colorScheme.primary
                    isToday -> MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                    else -> Color.Transparent
                }
            )
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = dayNumber.toString(),
                fontFamily = FontFamily.Monospace,
                fontSize = 12.sp,
                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal
            )
            if (todoCount > 0) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(if (isSelected) Color.White else MaterialTheme.colorScheme.secondary)
                )
            }
        }
    }
}

@Composable
private fun EmptyTodosState(
    isActiveTab: Boolean,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = if (isActiveTab) Icons.Default.RadioButtonUnchecked else Icons.Default.CheckCircle,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.secondary.copy(alpha = 0.4f),
            modifier = Modifier.size(64.dp)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = if (isActiveTab) "[ 暂无待办 ]" else "[ 无已完成 ]",
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
            fontSize = 16.sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = if (isActiveTab) "点击 + 添加一个新待办" else "完成的任务会出现在这里",
            fontFamily = FontFamily.Monospace,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f),
            fontSize = 12.sp
        )
    }
}

@Composable
private fun TodoItem(
    todo: TodoEntity,
    onToggle: () -> Unit,
    onDelete: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(8.dp),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onToggle() }
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Checkbox icon
            Icon(
                imageVector = if (todo.completed) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                contentDescription = if (todo.completed) "已完成" else "进行中",
                tint = if (todo.completed) 
                    MaterialTheme.colorScheme.secondary 
                else MaterialTheme.colorScheme.primary.copy(alpha = 0.5f),
                modifier = Modifier.size(24.dp)
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // Todo title
            Text(
                text = todo.title,
                fontFamily = FontFamily.Monospace,
                fontSize = 14.sp,
                color = if (todo.completed) 
                    MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                else MaterialTheme.colorScheme.onSurface,
                textDecoration = if (todo.completed) TextDecoration.LineThrough else null,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
            
            // Delete button
            IconButton(onClick = onDelete) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "删除",
                    tint = MaterialTheme.colorScheme.error.copy(alpha = 0.6f),
                    modifier = Modifier.size(20.dp)
                )
            }
            
            // Importance stars
            if (todo.importance > 0) {
                Row {
                    repeat(5) { index ->
                        Icon(
                            imageVector = if (index < todo.importance) Icons.Default.Star else Icons.Default.StarBorder,
                            contentDescription = null,
                            tint = if (index < todo.importance) 
                                MaterialTheme.colorScheme.secondary 
                            else MaterialTheme.colorScheme.secondary.copy(alpha = 0.3f),
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CreateTodoDialog(
    title: String,
    onTitleChange: (String) -> Unit,
    importance: Int,
    onImportanceChange: (Int) -> Unit,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "新建待办",
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Medium
            )
        },
        text = {
            Column {
                OutlinedTextField(
                    value = title,
                    onValueChange = onTitleChange,
                    placeholder = {
                        Text(
                            text = "待办内容...",
                            fontFamily = FontFamily.Monospace
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Importance star rating
                Text(
                    text = "重要性",
                    fontFamily = FontFamily.Monospace,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    repeat(5) { index ->
                        IconButton(
                            onClick = { 
                                onImportanceChange(if (importance == index + 1) 0 else index + 1)
                            }
                        ) {
                            Icon(
                                imageVector = if (index < importance) Icons.Default.Star else Icons.Default.StarBorder,
                                contentDescription = "第 ${index + 1} 星",
                                tint = if (index < importance) 
                                    MaterialTheme.colorScheme.secondary 
                                else MaterialTheme.colorScheme.secondary.copy(alpha = 0.3f),
                                modifier = Modifier.size(32.dp)
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = onConfirm,
                enabled = title.isNotBlank()
            ) {
                Text(
                    text = "添加",
                    fontFamily = FontFamily.Monospace,
                    color = if (title.isNotBlank()) 
                        MaterialTheme.colorScheme.primary 
                    else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                )
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(
                    text = "取消",
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    )
}