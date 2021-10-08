import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/Schemas/user.schema';
import { UserDTO } from 'src/DTO/User.dto';
import { sha256 } from 'js-sha256';
import { JwtService } from '@nestjs/jwt';
import { ImageService } from 'src/image/image.service';
import { ChatService } from '../chat/chat.service';
import { GroupService } from 'src/group/group.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
     private imageService: ImageService,      
       @Inject(forwardRef(() => GroupService)) private groupService: GroupService,
       @Inject(forwardRef(() => ChatService)) private chatService: ChatService
  ) {}

  async registerUser(data: UserDTO) {
    if (data.password == data.confirmPassword) {
      const tempUser = await this.userModel.findOne({
        username: data.username,
      });
      if (!tempUser) {
        const hashPass = sha256(data.password.toString());
        data.password = hashPass;
        const userData = new this.userModel();
        userData.username = data.username;
        userData.password = data.password;
        userData.email = data.email;  
        userData.date = new Date(); 
        await userData.save();
        if (data.image){
          await this.imageService.createImage(userData.id, data.image)
        }     
        return { status: true, msg: 'User created successfully' };
      } else {
        return { status: false, msg: 'User already exist' };
      }
    } else {
      return { status: false, msg: 'The passwords are not the same' };
    }
  }

  async login(data: UserDTO) {
    const tempUser = await this.userModel.findOne({ username: data.username });
    if (tempUser) {
      const hashPass = sha256(data.password.toString());
      if (tempUser.password.toString() == hashPass.toString()) {
        const token = await this.jwtService.signAsync(tempUser.id);
        return { status: true, token };
      } else {
        return { status: false, msg: 'The password not match' };
      }
    } else {
      return { status: false, msg: 'The user not exist' };
    }
  }

  async verifyToken(token: string) {
    try {
      const id = await this.jwtService.verifyAsync(token);
      if (id) {
        const data = await this.userModel.findById(id);
        const image = await this.imageService.getImage(id);
        return { status: true, username: data.username, image };
      } else {
        return { status: false, msg: 'Invalid Id' };
      }
    } catch (e) {
      console.log('This token is invalid ', token);
      return { status: false, msg: 'Invalid Token' };
    }
  }

  async verifyPass(token: string, dataPost: UserDTO) {
    try {
      const id = await this.jwtService.verifyAsync(token);
      if (id) {
        const data = await this.userModel.findById(id);
        const hashPass = sha256(dataPost.password);
        if (data.password === hashPass){
          return {status: true}
        }else {
          return {status: false, msg: 'Invalid password'}
        }
      } else {
        return { status: false, msg: 'Invalid Id' };
      }
    } catch (e) {
      console.log('This token is invalid ', token);
      return { status: false, msg: 'Invalid Token' };
    }
  }

  async updateUser(token: string, data: UserDTO) {
    try {
      const id = await this.jwtService.verifyAsync(token);
      if (id) {
        //console.log(data.email);
        if (data.username){
          const user = await this.userModel.findOne({ username: data.username });
          //console.log(user);
          if (!user){
            //console.log('here');
            await this.userModel.findByIdAndUpdate(id, {username: data.username})
            return { status: true, msg: 'User updated'};
          }else {
            return { status: false, msg: 'This user name already exist' };
          }
        }

        if (data.email){
          await this.userModel.findByIdAndUpdate(id, { email: data.email });
          return { status: true, msg: 'Email updated' };
        }

        if (data.password){
          await this.userModel.findByIdAndUpdate(id, { password: sha256(data.password) });
          return { status: true, msg: 'Password updated' };
        }

        if (data.image){
          if (data.image === 'none'){
            await this.imageService.setImageNull(id)
          }else {
            await this.imageService.updateImage(id, data.image)
          }
          return { status: true, msg: 'Image updated' };
        }
        
      } else {
        return { status: false, msg: 'Invalid Id' };
      }
    } catch (e) {
      console.log('This token is invalid ', token);
      return { status: false, msg: 'Invalid Token' };
    }
  }

  async deleteUser(token:string){
    try {
      const id = await this.jwtService.verifyAsync(token);
      if (id) {
        await this.chatService.deleteUser(id);
        await this.groupService.deleteUser(id);
        await this.imageService.setImageNull(id);
        await this.userModel.findByIdAndDelete(id);
        return { status: true };
      } else {
        return { status: false, msg: 'Invalid Id' };
      }
    } catch (e) {
      console.log('This token is invalid ', token);
      return { status: false, msg: 'Invalid Token' };
    }
  }

  async getAllUsers(token:string) {
    try {
      const id = await this.jwtService.verifyAsync(token);
      if (id) {
        let data = await this.userModel.find();
        data = data.filter((item) => item.id !== id);
        const users = [];
        await Promise.all(data.map(async (item) => {
          let user = {
            username:'',
            image: await this.imageService.getImage(item.id)
          }
          user.username = item.username.toString();
          users.push(user)          
        }));
        console.log(users)
        return { status:true, users } 
      } else {
        return { status: false, msg: 'Invalid Id' };
      }
    } catch (e) {
      console.log('This token is invalid ', token);
      return { status: false, msg: 'Invalid Token' };
    }
  }

  async getId(username){
    const data = await this.userModel.findOne({username: username});
    return data.id;
  }

  async getUsername(id: string){
    const data = await this.userModel.findById(id);
    return data.username;
  }

}
