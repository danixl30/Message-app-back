import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosResponse } from 'axios';
import { v2 } from "cloudinary";
import { Model } from 'mongoose';
import { Image, ImageDocument } from 'src/Schemas/Image.schema';


v2.config({
    cloud_name: 'dfgd7hsw3', 
    api_key: '522569626842588', 
    api_secret: 'WnyV1hvgq0dYpyv3K9a6RFkUFrs',
    secure: true
})

@Injectable()
export class ImageService {
    constructor(@InjectModel(Image.name) private imageModel: Model<ImageDocument>, private jwtService: JwtService, private httpService: HttpService){}

    async createImage(id: string, image: string){
        const newData = new this.imageModel();
        newData.itemId = id;
        await v2.uploader.upload(image, async (error, result) => {
            if (error) {
                return;
            }
            newData.url = result.secure_url;
            console.log(newData);
            await newData.save();
        })
    }

    async updateImage(id: string, image: string){
        const data = await this.imageModel.findOne({itemId: id});
        if (data){
            await v2.uploader.upload(image, async (error, result) => {
                if (error) {
                    return;
                }
                await this.imageModel.findOneAndUpdate({itemId: id}, {url: result.secure_url});
            })
        }else {
            await this.createImage(id, image)
        }
    }

    async setImageNull(id: string){
        await this.imageModel.findOneAndDelete({itemId: id})
    }

    async getImage(id: string){
        const data = await this.imageModel.findOne({itemId:id});
        if (data){
            return data.url;
        }else {
            return null;
        }
    }
}
