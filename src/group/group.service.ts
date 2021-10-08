import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GroupDTO } from 'src/DTO/Group.dto';
import { ImageService } from 'src/image/image.service';
import { Group, GroupDocument } from 'src/Schemas/Group.schema';
import { UserGroups, UserGroupsDocument } from 'src/Schemas/Groups.users.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class GroupService {
    constructor(@InjectModel(Group.name) private groupModel: Model<GroupDocument>, @InjectModel(UserGroups.name) private userGroupsModel: Model<UserGroupsDocument>, private jwtService: JwtService, @Inject(forwardRef(() => UserService)) private userService: UserService, private imageService: ImageService){}

    async createGroup(token, data: GroupDTO){
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                const group = await this.groupModel.findOne({name: data.name});
                if (group){
                    return {status:false, msg: 'This group already exist'};
                }
                const resultUserGroup = await this.userGroupsModel.findOne({userId: id});
                if (resultUserGroup){
                    const newGroup = new this.groupModel();
                    newGroup.name = data.name;
                    let admins: string[] = [];
                    admins.push(id);
                    newGroup.adminMembers = admins;
                    let groupsUser = resultUserGroup.groups;
                    groupsUser.push(newGroup.id);
                    await this.userGroupsModel.findOneAndUpdate({userId:resultUserGroup.userId}, {groups:groupsUser})
                    let members = data.usersToAdd;
                    console.log(typeof members[0])
                    let ids = [];
                    for(let i:number = 0; i < members.length; i++){
                        let idUser = await this.userService.getId(members[i].toString())
                        ids.push(idUser);
                    }
                    newGroup.normalMembers = ids;
                    for(let i:number = 0; i < ids.length; i++){
                        let resultOtherUser = await this.userGroupsModel.findOne({userId: ids[i]});
                        if (resultOtherUser){
                            let otherIds = resultOtherUser.groups;
                            otherIds.push(newGroup.id);
                            await this.userGroupsModel.findOneAndUpdate({userId:resultOtherUser.userId}, {groups:otherIds});
                        }else{
                            let newOtherUser = new this.userGroupsModel();
                            newOtherUser.userId = ids[i];
                            let otherGroupsIds: string[] = [];
                            otherGroupsIds.push(newGroup.id);
                            newOtherUser.groups = otherGroupsIds;
                            await newOtherUser.save();
                        }
                    }
                    await newGroup.save();
                    if (data.image){
                        await this.imageService.createImage(newGroup.id, data.image)
                    }
                    return {status: true};
                }else{
                    const dataUserToPush = new this.userGroupsModel();
                    dataUserToPush.userId = id;
                    const newGroup = new this.groupModel();
                    newGroup.name = data.name;
                    let admins: string[] = [];
                    admins.push(id);
                    newGroup.adminMembers = admins;
                    let groupsId: string[] = [];
                    groupsId.push(newGroup.id);
                    dataUserToPush.groups = groupsId;
                    await dataUserToPush.save();
                    let members = data.usersToAdd;
                    let ids = [];
                    for(let i:number = 0; i < members.length; i++){
                        let idUser = await (await this.userService.getId(members[i].toString())).toString();
                        ids.push(idUser);
                    }
                    newGroup.normalMembers = ids;
                    for(let i:number = 0; i < ids.length; i++){
                        let resultOtherUser = await this.userGroupsModel.findOne({userId: ids[i]});
                        if (resultOtherUser){
                            let otherIds = resultOtherUser.groups;
                            otherIds.push(newGroup.id);
                            await this.userGroupsModel.findOneAndUpdate({userId:resultOtherUser.userId}, {groups:otherIds});
                        }else{
                            let newOtherUser = new this.userGroupsModel();
                            newOtherUser.userId = ids[i];
                            let otherGroupsIds: string[] = [];
                            otherGroupsIds.push(newGroup.id);
                            newOtherUser.groups = otherGroupsIds;
                            await newOtherUser.save();
                        }
                    }
                    await newGroup.save();
                    if (data.image){
                        await this.imageService.createImage(newGroup.id, data.image);
                    }
                    return {status: true};
                }
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log(e);
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async listGroups(token: string){
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                const result = await this.userGroupsModel.findOne({userId: id});
                if (result){
                    let groups = [];
                    let dataGroups = result.groups;
                    for (let i = 0; i < dataGroups.length; i++){
                        let name = await this.groupModel.findById(dataGroups[i]);
                        let object = {
                            name: name.name,
                            image: await this.imageService.getImage(dataGroups[i])
                        };
                        groups.push(object);
                    }
                    return {status: true, groups};
                }else {
                    return {status: true, groups: []}
                }
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async listGroupMembers(token: string, data: GroupDTO){
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                const group = await this.groupModel.findOne({name: data.name});
                let admins = group.adminMembers;
                admins = admins.filter((admin) => {
                    return admin !== id});
                let normal = await group.normalMembers.filter(user => user !== id);
                let finalAdmins = [];
                if (admins.length > 0){
                    for (let i = 0; i < admins.length; i++){
                        let itemAdmin = {
                            username: await this.userService.getUsername(admins[i]),
                            image: await this.imageService.getImage(admins[i])
                        };
                        finalAdmins.push(itemAdmin);
                    }
                }
                let finalNormal = [];
                for (let i = 0; i < normal.length; i++){
                    let itemNormal= {
                        username: await this.userService.getUsername(normal[i]),
                        image: await this.imageService.getImage(normal[i]) 
                    };
                    finalNormal.push(itemNormal);
                }
                return {status: true, admins: finalAdmins, normal: finalNormal, userAdmin: group.adminMembers.find(member => id === member)? true: false};
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async deleteMember(token: string, data: GroupDTO){
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                const group = await this.groupModel.findOne({name: data.name});
                if (data.username){
                    const otherId = await this.userService.getId(data.username);
                    let admins = group.adminMembers.filter(admin => admin !== otherId);
                    let normal = group.normalMembers.filter(user => user !== otherId);
                    const otherUser = await this.userGroupsModel.findOne({userId: otherId});
                    let groups = otherUser.groups;
                    groups = groups.filter(groupD => groupD !== group.id);
                    await this.userGroupsModel.findOneAndUpdate({userId: otherId}, {groups});
                    if (admins.length <= 0 && normal.length <= 0){
                        await this.groupModel.findByIdAndDelete(group.id);
                        return {status: true};
                        
                    }
                    await this.groupModel.findByIdAndUpdate(group.id, {adminMembers: admins, normalMembers: normal});
                    return {status: true};
                }
                let admins = group.adminMembers.filter(admin => admin !== id);
                let normal = group.normalMembers.filter(user => user !== id);
                const otherUser = await this.userGroupsModel.findOne({userId: id});
                let groups = otherUser.groups.filter(groupD => groupD !== group.id);
                await this.userGroupsModel.findOneAndUpdate({userId: id}, {groups});
                if (admins.length <= 0 && normal.length <= 0){
                    await this.groupModel.findByIdAndDelete(group.id);
                    return {status: true};
                }
                await this.groupModel.findByIdAndUpdate(group.id, {adminMembers: admins, normalMembers: normal});
                return {status: true};
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async changeName(token: string, data: GroupDTO){
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                const resultTemp = await this.groupModel.findOne({name: data.newName});
                if (!resultTemp){
                    await this.groupModel.findOneAndUpdate({name: data.name}, {name: data.newName});
                    return {status: true};
                }else {
                    return {status: false, msg: 'This name already exist'};
                }
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async addMember(token:string, data:GroupDTO){
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                const otherId = await this.userService.getId(data.username);
                const group = await this.groupModel.findOne({name: data.name});
                const members = group.normalMembers;
                members.push(otherId);
                await this.groupModel.findByIdAndUpdate(group.id, {normalMembers: members});
                const otherUser = await this.userGroupsModel.findOne({userId: otherId});
                if (otherUser){
                    let groups = otherUser.groups;
                    groups.push(group.id);
                    await this.userGroupsModel.findOneAndUpdate({userId:otherId}, {groups});
                }else{
                    const newUser = new this.userGroupsModel();
                    newUser.userId = otherId;
                    newUser.groups = [group.id];
                    await newUser.save();
                }
                return {status: true};
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async setAdmin(token:string, data: GroupDTO){
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                console.log(data);
                const result = await this.groupModel.findOne({name: data.name});
                const otherId = await this.userService.getId(data.username);
                let normal = result.normalMembers.filter(member => member !== otherId);
                let admins: string[] = result.adminMembers;
                admins.push(otherId);
                await this.groupModel.findByIdAndUpdate(result.id, {normalMembers: normal, adminMembers: admins});
                return {status: true};
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log(e);
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async unSetAdmin(token:string, data: GroupDTO){
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                const result = await this.groupModel.findOne({name: data.name});
                if(data.username){
                    const otherId = await this.userService.getId(data.username);
                    let admins= result.adminMembers.filter(member => member !== otherId);
                    let normal: string[] = result.normalMembers;
                    normal.push(otherId);
                    await this.groupModel.findByIdAndUpdate(result.id, {normalMembers: normal, adminMembers: admins});
                }else{
                    let admins= result.adminMembers.filter(member => member !== id);
                    let normal: string[] = result.normalMembers;
                    normal.push(id);
                    await this.groupModel.findByIdAndUpdate(result.id, {normalMembers: normal, adminMembers: admins});
                }
                return {status: true};
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async setImage(token:string, data:GroupDTO){
        try {
            const id = await this.jwtService.verifyAsync(token);
            if (id) {
                const result = await this.groupModel.findOne({name: data.name});
                if (data.image){
                    await this.imageService.updateImage(result.id, data.image)
                }else {
                    await this.imageService.setImageNull(result.id);
                }
                return {status: true};
            } else {
                return { status: false, msg: 'Invalid Id' };
            }
        } catch (e) {
            console.log('This token is invalid ', token);
            return { status: false, msg: 'Invalid Token' };
        }
    }

    async deleteUser(id: string){
        const data = await this.userGroupsModel.findOne({userId: id});
        const groups = data.groups;
        await Promise.all(groups.map(async (group) => {
            let dataG = await this.groupModel.findById(group);
            let normal = dataG.normalMembers.filter(item => item !== id);
            let admins = dataG.adminMembers.filter(item => item !== id);
            if (admins.length <= 0){
                admins = normal;
                normal = [];
            }
            if (admins.length <= 0 && normal.length <= 0){
                await this.groupModel.findByIdAndDelete(group);
            }else {
                await this.groupModel.findByIdAndUpdate(group, {normalMembers: normal, adminMembers: admins});
            }
        }))
        await this.userGroupsModel.findOneAndDelete({userId: id});
    }
}
