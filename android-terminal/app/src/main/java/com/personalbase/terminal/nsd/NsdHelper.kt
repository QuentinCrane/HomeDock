package com.personalbase.terminal.nsd

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class NsdHelper(context: Context) {
    private val nsdManager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
    private val SERVICE_TYPE = "_returnport._tcp."
    
    private val _discoveredIp = MutableStateFlow<String?>(null)
    val discoveredIp: StateFlow<String?> = _discoveredIp

    private val resolveListener = object : NsdManager.ResolveListener {
        override fun onResolveFailed(serviceInfo: NsdServiceInfo, errorCode: Int) {
            Log.e("NsdHelper", "Resolve failed: $errorCode")
        }

        override fun onServiceResolved(serviceInfo: NsdServiceInfo) {
            Log.e("NsdHelper", "Resolve Succeeded. ${serviceInfo.host.hostAddress}:${serviceInfo.port}")
            _discoveredIp.value = "http://${serviceInfo.host.hostAddress}:${serviceInfo.port}"
        }
    }

    private val discoveryListener = object : NsdManager.DiscoveryListener {
        override fun onDiscoveryStarted(regType: String) {
            Log.d("NsdHelper", "Service discovery started")
        }

        override fun onServiceFound(service: NsdServiceInfo) {
            Log.d("NsdHelper", "Service discovery success $service")
            if (service.serviceType == SERVICE_TYPE) {
                nsdManager.resolveService(service, resolveListener)
            }
        }

        override fun onServiceLost(service: NsdServiceInfo) {
            Log.e("NsdHelper", "service lost: $service")
            if (_discoveredIp.value != null) {
                _discoveredIp.value = null
            }
        }

        override fun onDiscoveryStopped(serviceType: String) {
            Log.i("NsdHelper", "Discovery stopped: $serviceType")
        }

        override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
            Log.e("NsdHelper", "Discovery failed: Error code:$errorCode")
            nsdManager.stopServiceDiscovery(this)
        }

        override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {
            Log.e("NsdHelper", "Discovery failed: Error code:$errorCode")
            nsdManager.stopServiceDiscovery(this)
        }
    }

    fun startDiscovery() {
        try {
            nsdManager.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, discoveryListener)
        } catch (e: Exception) {
            Log.e("NsdHelper", "Error starting discovery", e)
        }
    }

    fun stopDiscovery() {
        try {
            nsdManager.stopServiceDiscovery(discoveryListener)
        } catch (e: Exception) {
            Log.e("NsdHelper", "Error stopping discovery", e)
        }
    }

    /**
     * Set manual IP address for base station.
     * This is a fallback when mDNS discovery fails.
     * @param ip The IP address (with optional port), e.g., "192.168.1.100" or "192.168.1.100:3000"
     */
    fun setManualIp(ip: String) {
        val baseUrl = when {
            ip.startsWith("http://") -> ip
            ip.startsWith("https://") -> ip
            ip.contains(":") -> "http://$ip"  // has port
            else -> "http://$ip:3000"  // default port
        }
        _discoveredIp.value = baseUrl
        Log.i("NsdHelper", "Manual IP set to: $baseUrl")
    }
}
