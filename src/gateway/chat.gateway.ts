import { ConnectedSocket, WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from "@nestjs/websockets";
import { Socket } from "Socket.io";
import { Server } from "Socket.io";
import { UserJoinDto } from "src/DTO/joinUser.dto";
import { MessageDto } from "src/DTO/Message.dto";
import { SetGroupsDto } from "src/DTO/SetGroups.dto";
import { TypingDto } from "src/DTO/typing.dto";

@WebSocketGateway(5000, {cors: true})
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    private idRecords = new Map();
    private groupsRecords = new Map();

    @SubscribeMessage('connection')
    onEvent(@ConnectedSocket() client:Socket, @MessageBody() data: UserJoinDto){
        console.log(data);
        this.idRecords.set(data.username, client.id);
    }

    @SubscribeMessage('typing')
    onTyping(@MessageBody() data: TypingDto, @ConnectedSocket() client:Socket){
        this.server.to(data.type === 'individual' ? this.idRecords.get(data.to): this.groupsRecords.get(data.to).filter(id => id !== client.id)).emit('typing', {'msg': data.msg, 'from': data.from, type: data.type, name: data.to});
    }

    @SubscribeMessage('privateMsg')
    onPrivateMsg(@MessageBody() data: MessageDto, @ConnectedSocket() client:Socket){
        console.log(this.idRecords.get(data.to));
        this.server.to([this.idRecords.get(data.to), client.id]).emit('privateMsg', {'from': data.from, 'msg': data.msg, 'to': data.to})
    }
    
    @SubscribeMessage('setGroup')
    onSetGroup(@ConnectedSocket() client:Socket, @MessageBody() data: SetGroupsDto){
        let groups: string[] = data.groups;
        groups.map(group => {
            if (this.groupsRecords.has(group)){
                let members = this.groupsRecords.get(group);
                if (!members.find(member => member === client.id)){
                    members = [...members, client.id];
                    this.groupsRecords.set(group, members);
                }
            }else {
                let members = [client.id];
                this.groupsRecords.set(group, members);
            }
        })
    }

    @SubscribeMessage('groupMsg')
    onGroupMessage(@ConnectedSocket() client:Socket, @MessageBody() data){
        console.log(this.groupsRecords)
        if (!data.to){
            console.log(data);
            this.server.to(this.groupsRecords.get(data.groupName)).emit('groupMsg', {name: data.groupName, from: data.from, type: 'public', msg: data.msg})
        }else {
            let membersName = data.to;
            let members = []
            for (let i = 0; i < membersName.length; i++){
                if (this.idRecords.has(membersName[i])){
                    members.push(this.idRecords.get(membersName[i]));
                }
            }
            members.push(client.id);
            console.log(this.idRecords);
            console.log(members);
            this.server.to(members).emit('groupMsg', {name: data.groupName, from: data.from, type: 'private', msg: data.msg})
        }
    }

    @SubscribeMessage('deleteChat')
    onDeleteChat(@MessageBody() data){
        this.server.to(this.idRecords.get(data.to)).emit('deleteChat', {from: data.from});
    }

    @SubscribeMessage('deleteGroup')
    onDeleteGroup(@MessageBody() data, @ConnectedSocket() client: Socket){
        if (!data.username){
            this.groupsRecords.set(data.name, this.groupsRecords.get(data.name).filter(id => id !== client.id));
        }else {
            this.groupsRecords.set(data.name, this.groupsRecords.get(data.name).filter(id => id !== this.idRecords.get(data.username)));
            this.server.to(this.idRecords.get(data.username)).emit('delete', {name: data.name})
        }
    }
}