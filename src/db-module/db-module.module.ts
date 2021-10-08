import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from 'src/chat/chat.controller';
import { ChatService } from 'src/chat/chat.service';
import { ChatGateway } from 'src/gateway/chat.gateway';
import { GroupController } from 'src/group/group.controller';
import { GroupService } from 'src/group/group.service';
import { ImageController } from 'src/image/image.controller';
import { ImageService } from 'src/image/image.service';
import { Chat, ChatSchema } from 'src/Schemas/Chat.schema';
import { Group, GroupSchema } from 'src/Schemas/Group.schema';
import { UserGroups, UserGroupsSchema } from 'src/Schemas/Groups.users.schema';
import { Image, ImageSchema } from 'src/Schemas/Image.schema';
import { User, UserSchema } from 'src/Schemas/user.schema';
import { UserController } from 'src/user/user.controller';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }, { name: Chat.name, schema: ChatSchema}, { name: Group.name, schema: GroupSchema }, { name: UserGroups.name, schema: UserGroupsSchema}, { name: Image.name, schema: ImageSchema }]),
    JwtModule.register({
      secret: 'ChatApp',
      //signOptions: { expiresIn: '172800000' },
    }), HttpModule
  ],
  controllers: [UserController, ChatController, GroupController, ImageController],
  providers: [UserService , ChatService , ChatGateway, ImageService, GroupService],
})
export class DbModuleModule {}
