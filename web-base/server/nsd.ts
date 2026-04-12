/**
 * ============================================================
 * 服务发现模块 / Network Service Discovery Module
 * ============================================================
 * 
 * 本模块使用 Bonjour/mDNS 协议在局域网内广播服务。
 * 
 * 工作原理:
 * - Android 终端通过 NsdManager (Network Service Discovery) 发现服务
 * - Web Base 广播为 _returnport._tcp 服务
 * - 服务名称包含主机名: PersonalBase-{hostname}
 * 
 * 用途:
 * - Android 端可自动发现内网中的主基地
 * - 无需手动输入 IP 地址
 * - 支持多设备同时连接
 * 
 * 生命周期:
 * - 启动时发布服务
 * - 收到 SIGINT (Ctrl+C) 时优雅关闭
 */

import { Bonjour } from 'bonjour-service';
import os from 'os';

const bonjour = new Bonjour();

/**
 * 启动 Bonjour/mDNS 服务广播
 * @param port - Web Base 服务端口号 (默认 3000)
 */
export function startBonjourService(port: number) {
  const hostname = os.hostname();
  console.log(`Starting Bonjour/mDNS service discovery on port ${port}...`);
  
  // 发布 _returnport._tcp 服务
  const service = bonjour.publish({
    name: `PersonalBase-${hostname}`,
    type: 'returnport',
    protocol: 'tcp',
    port: port,
    txt: { version: '1.0' }
  });

  service.on('up', () => {
    console.log(`Service published: ${service.name} as _returnport._tcp on port ${port}`);
  });

  service.on('error', (err) => {
    console.error('Bonjour service error:', err);
  });

  // 优雅关闭 - 收到 Ctrl+C 时取消服务发布
  process.on('SIGINT', () => {
    console.log('Unpublishing Bonjour service...');
    bonjour.unpublishAll(() => {
      bonjour.destroy();
      process.exit();
    });
  });
}
