import { Body, Controller, Delete, forwardRef, Get, Headers, Inject, Post } from '@nestjs/common';
import { ChatDto } from 'src/DTO/Chat.dto';
import { HeaderDTO } from 'src/DTO/Hearder.Dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
    constructor(@Inject(forwardRef(() => ChatService)) private chatService: ChatService){}

    @Post('/insert')
    insertChat(@Headers() token: HeaderDTO, @Body() data: ChatDto){
        return this.chatService.insertChat(token.auth, data.chatName);
    }

    @Get('/listChats')
    listChats(@Headers() token: HeaderDTO){
        return this.chatService.listChats(token.auth);
    }

    @Delete('/deleteChat')
    deleteChat(@Headers() token: HeaderDTO, @Body() data: ChatDto){
        return this.chatService.deleteChat(token.auth, data.chatName);
    }
}
