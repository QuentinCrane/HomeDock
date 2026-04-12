package com.personalbase.terminal.data

import android.content.Context
import android.content.Intent
import android.provider.CalendarContract
import android.util.Log

/**
 * Helper class for creating calendar events via Android Intent.
 * Uses Intent(Intent.ACTION_INSERT) for broad compatibility with calendar apps.
 */
class CalendarHelper(private val context: Context) {

    companion object {
        private const val TAG = "CalendarHelper"
    }

    /**
     * Creates a calendar event by launching the system calendar app.
     * 
     * @param title The event title
     * @param description The event description (optional)
     * @param dueDate The due date/time in milliseconds (optional). If provided, sets the event start time.
     * @return true if the intent was successfully launched, false otherwise
     */
    fun createCalendarEvent(
        title: String,
        description: String? = null,
        dueDate: Long? = null
    ): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_INSERT).apply {
                data = CalendarContract.Events.CONTENT_URI
                putExtra(CalendarContract.Events.TITLE, title)
                if (!description.isNullOrBlank()) {
                    putExtra(CalendarContract.Events.DESCRIPTION, description)
                }
                if (dueDate != null && dueDate > 0) {
                    putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, dueDate)
                    putExtra(CalendarContract.EXTRA_EVENT_END_TIME, dueDate + 3600000) // Default 1 hour duration
                }
            }

            // Check if there's an app to handle this intent
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                Log.i(TAG, "Calendar event creator launched successfully")
                true
            } else {
                Log.w(TAG, "No calendar app found to handle the intent")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error creating calendar event: ${e.message}", e)
            false
        }
    }

    /**
     * Opens the system calendar app to the current date.
     * 
     * @return true if the intent was successfully launched, false otherwise
     */
    fun openCalendar(): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = CalendarContract.CONTENT_URI
            }

            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                true
            } else {
                Log.w(TAG, "No calendar app found to handle the intent")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error opening calendar: ${e.message}", e)
            false
        }
    }
}