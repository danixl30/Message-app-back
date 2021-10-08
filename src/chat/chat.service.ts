import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ImageService } from 'src/image/image.service';
import { Chat, ChatDocument } from 'src/Schemas/Chat.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ChatService {
    constructor(@InjectModel(Chat.name) private chatSchema: Model<ChatDocument>, private jwtService: JwtService, @Inject(forwardRef(() => UserService)) private userService: UserService, private imageService: ImageService){}

    async insertChat(token: string, chatName: string) {
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                const data = await this.chatSchema.findOne({userId: id});
                const otherUserId = await this.userService.getId(chatName);
                if (data){
                    const chats = data.chats;
                    chats.push(otherUserId);
                    await this.chatSchema.findOneAndUpdate({userId: id}, {chats})
                }else {
                    const newChat = new this.chatSchema();
                    newChat.userId = id;
                    const arrayChats: string[] = [];
                    arrayChats.push(otherUserId);
                    newChat.chats = arrayChats;
                    await newChat.save();
                }
                const dataOther = await this.chatSchema.findOne({userId: otherUserId});
                if (dataOther){
                    const otherChats = dataOther.chats;
                    otherChats.push(id);
                    await this.chatSchema.findOneAndUpdate({userId: otherUserId}, {chats: otherChats});
                }else{
                    const newOtherChat = new this.chatSchema();
                    newOtherChat.userId = otherUserId;
                    const chats = [];
                    chats.push(id);
                    newOtherChat.chats = chats;
                    await newOtherChat.save();
                }
                return {status: true, msg: 'Chat saved'};
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async listChats(token: string) {
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                const data = await this.chatSchema.findOne({userId: id});
                //console.log(data);
                if (data){
                    const dataChats = data.chats;
                    let chatsFinal = [];
                    for (let i:number = 0; i < dataChats.length; i++){
                        let item = {
                            username: await this.userService.getUsername(dataChats[i]),
                            image: await this.imageService.getImage(dataChats[i])
                        }
                        //console.log(item);
                        await chatsFinal.push(item)
                    }
                    //console.log(chatsFinal);
                    return { status: true, chats: chatsFinal };
                }else {
                    return { status: true, chats: []}
                }
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async deleteChat(token: string, chatName: string){
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                const data = await this.chatSchema.findOne({userId: id});
                const otherId = await this.userService.getId(chatName);
                let chats = data.chats;
                chats = chats.filter((chat) => chat !== otherId);
                await this.chatSchema.findOneAndUpdate({userId: id}, {chats});
                const otherData = await this.chatSchema.findOne({userId: otherId});
                chats = otherData.chats;
                chats = chats.filter((chat) => chat !== id);
                await this.chatSchema.findOneAndUpdate({userId: otherId}, {chats});
                return {status: true, msg: 'Chat deleted'}
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async deleteUser(id: string){
        const data = await this.chatSchema.findOne({userId: id});
        const chats = data.chats;
        await Promise.all(chats.map(async (chat) => {
            let otherData = await this.chatSchema.findOne({userId: chat});
            let chats = otherData.chats.filter(item => item !== id);
            await this.chatSchema.findOneAndUpdate({userId: chat}, {chats});
        }))
        await this.chatSchema.findByIdAndDelete(data.id);
    }
}
