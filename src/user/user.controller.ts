import { Body, Controller, Delete, Get, Headers, Post, Put } from '@nestjs/common';
import { HeaderDTO } from 'src/DTO/Hearder.Dto';
import { UserDTO } from 'src/DTO/User.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor (private userService: UserService){}
  @Post('/register')
  async registerUser(@Body() data:UserDTO) {
    return await this.userService.registerUser(data);
  }

  @Post('/login')
  async loginUser(@Body() data:UserDTO) {
    return await this.userService.login(data);
  }

  @Get('/username')
  async getUsername(@Headers() data: HeaderDTO){
    return await this.userService.verifyToken(data.auth);
  }

  @Delete('/delete')
  deleteUser(@Headers() token: HeaderDTO) {
    return this.userService.deleteUser(token.auth);
  }

  @Put('/update')
  async updateUser(@Headers() token: HeaderDTO, @Body() data: UserDTO) {
    return await this.userService.updateUser(token.auth, data);
  }

  @Get('/allUsers')
  getAllUsers(@Headers() data:HeaderDTO) {
    return this.userService.getAllUsers(data.auth);
  }

  @Post('/verifyPass')
  verifyPass(@Headers() token: HeaderDTO, @Body() data: UserDTO) {
    return this.userService.verifyPass(token.auth, data);
  }
}
