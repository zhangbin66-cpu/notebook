const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8080 });

// 存储连接的客户端
const clients = new Map();

wss.on('connection', (ws) => {
    const clientId = uuidv4();
    clients.set(clientId, ws);
    
    // 发送客户端ID
    ws.send(JSON.stringify({
        type: 'id',
        id: clientId
    }));
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch(data.type) {
            case 'file':
                // 转发文件数据到目标客户端
                const targetClient = clients.get(data.targetId);
                if (targetClient) {
                    targetClient.send(JSON.stringify({
                        type: 'file',
                        senderId: clientId,
                        fileName: data.fileName,
                        fileData: data.fileData,
                        progress: data.progress
                    }));
                }
                break;
        }
    });
    
    ws.on('close', () => {
        clients.delete(clientId);
    });
});

console.log('WebSocket 服务器运行在端口 8080'); 