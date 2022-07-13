// console.log("hellow wereol");

// class Alien {
//   constructor(name, phrase) {
//     this.name = name;
//     this.phrase = phrase;
//     this.species = "alien";
//   }
//   fly = () => console.log("zzzzzzzzzzzzzz");
//   sayPhrase = () => {
//     console.log(this.phrase);
//   };
// }

// class Bug {
//   constructor(name, phrase) {
//     this.name = name;
//     this.phrase = phrase;
//     this.species = "bug";
//   }
//   hide = () => console.log("you can not catch me now!");
//   sayPhrase = () => console.log(this.phrase);
// }

// class Robot{
//     constructor(name,phrase){
//         this.name=name;
//         this.phrase=phrase;
//         this.species='robot'
//     }
//     transform=()=>console.log('optimus prime!');
//     sayPhrase=()=>console.log(this.phrase)
// }

// const alien1=new Alien('Ali','i am Ali the alien!');
// const alien2=new Alien('Lien','run for your livers!');
// const bug1=new Bug('buggy','your debugger doesnot work with me!');
// const bug2=new Bug('Erik','i drink decaf!');
// const Robot1=new Robot('Tito','i can cook,wim and dance!');
// const Robot2=new Robot('terminator','hasta la vista,baby!');
// alien1.fly()

// 父>>>子继承
// class Enemy{
//     constructor(power){
//         this.power=power
//     }
//     attack=()=>console.log(`i'm attacking with a power of ${this.power}!`)
// }
// class Alien extends Enemy{
//     constructor(name,phrase,power){
//         super(power)
//         this.name=name;
//         this.phrase=phrase;
//         this.species='alien'
//     }
//     fly=()=>console.log('zzzzzzzzzgggggzzzz');
//     sayPhrase=()=>console.log(this.phrase)
// }

// const alien1=new Alien('Ali','i am this alien',10)
// console.log('alien',alien1)
// alien1.attack();

// 祖>>>>子 继承
class Character{
    constructor(speed){
        this.speed=speed;
    }
    move=()=>console.log(`i'm moving at this speed of ${this.speed}`)
}
class Enemy extends Character{
    constructor(power,speed){
        super(speed);
        this.power=power
    }
    attack=()=>console.log(`i'm attacking with a power of ${this.power}`)
}
class Alien extends Enemy{
    constructor(name,phrase,power,speed){
        super(power,speed)
        this.name=name;
        this.phrase=phrase;
        this.species='alien'
    }
    fly=()=>console.log('xxxxxxxxxxxxx');
    sayPhrase=()=>console.log(this.phrase)
}

const alien1=new Alien('Ali','i am ali this alien!',10,50)
alien1.move();

