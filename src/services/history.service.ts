type SecurityEvent={

    id:string;
    
    type:
    'fuel'|
    'pallet'|
    'full_attack';
    
    sensor:string;
    
    time:string;
    
    siren:boolean;
    
    communitySent:boolean;
    
    location?:string;
    
    };
    
    class HistoryService{
    
    private events:SecurityEvent[]=[];
    
    generateId():string{
    
    return Math.random()
    .toString(36)
    .substring(2,10);
    
    }
    
    add(
    
    event:Omit<
    SecurityEvent,
    'id'
    >
    
    ):SecurityEvent{
    
    try{
    
    const newEvent={
    
    id:
    this.generateId(),
    
    ...event
    
    };
    
    this.events.unshift(
    newEvent
    );
    
    console.log(
    'Evento salvo:',
    newEvent
    );
    
    return newEvent;
    
    }
    catch(error){
    
    console.log(
    'Erro histórico:',
    error
    );
    
    throw error;
    
    }
    
    }
    
    getAll():
    
    SecurityEvent[]{
    
    return this.events;
    
    }
    
    clear():void{
    
    this.events=[];
    
    console.log(
    'Histórico limpo'
    );
    
    }
    
    }
    
    export const historyService=
    new HistoryService();