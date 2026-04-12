package com.personalbase.terminal

import android.app.Application
import com.personalbase.terminal.data.AppDatabase
import com.personalbase.terminal.data.CapsuleRepository
import com.personalbase.terminal.data.TodoRepository

class TerminalApp : Application() {
    lateinit var database: AppDatabase
    lateinit var repository: CapsuleRepository
    lateinit var todoRepository: TodoRepository

    override fun onCreate() {
        super.onCreate()
        database = AppDatabase.getDatabase(this)
        repository = CapsuleRepository(database.capsuleDao())
        todoRepository = TodoRepository(database.todoDao())
    }
}
