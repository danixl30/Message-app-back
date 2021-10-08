import { Body, Controller, Delete, Get, Headers, Post, Put } from '@nestjs/common';
import { GroupDTO } from 'src/DTO/Group.dto';
import { HeaderDTO } from 'src/DTO/Hearder.Dto';
import { GroupService } from './group.service';

@Controller('group')
export class GroupController {
    constructor(private groupService: GroupService){}

    @Post('/create')
    createGroup(@Headers() token: HeaderDTO, @Body() data: GroupDTO){
        return this.groupService.createGroup(token.auth, data);
    }

    @Get('/listGroups')
    listGroups(@Headers() token: HeaderDTO){
        return this.groupService.listGroups(token.auth);
    }

    @Post('/listMembers')
    listMembers(@Headers() token: HeaderDTO, @Body() data: GroupDTO){
        return this.groupService.listGroupMembers(token.auth, data);
    }

    @Delete('/deleteMember')
    deleteMember(@Headers() token: HeaderDTO, @Body() data: GroupDTO){
        return this.groupService.deleteMember(token.auth, data);
    }

    @Put('/changeName')
    changeName(@Headers() token: HeaderDTO, @Body() data: GroupDTO){
        return this.groupService.changeName(token.auth, data);
    }

    @Put('/addMember')
    addMember(@Headers() token: HeaderDTO, @Body() data: GroupDTO){
        return this.groupService.addMember(token.auth, data);
    }

    @Put('/setAdmin')
    setAdmin(@Headers() token: HeaderDTO, @Body() data: GroupDTO){
        return this.groupService.setAdmin(token.auth, data);
    }

    @Put('/unsetAdmin')
    unsetAdmin(@Headers() token: HeaderDTO, @Body() data: GroupDTO){
        return this.groupService.unSetAdmin(token.auth, data);
    }

    @Put('/setImage')
    setImage(@Headers() token: HeaderDTO, @Body() data: GroupDTO){
        return this.groupService.setImage(token.auth, data);
    }
}
