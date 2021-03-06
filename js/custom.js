//This work is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License

	var DEFAULT_NOTES = ['D1','A1','Bb1','C2','D2','E2','F2','A2'];	
	var notes = DEFAULT_NOTES;
	var Scale = function(scale){
		if(scale=='hang'){return DEFAULT_NOTES}
		else if(scale=='maj'){return ['C1','D1','E1','F1','G1','A1','B1','C2','D2','E2','F2','G2','A2','B2'];}
		else if(scale=='min'){return ['C1','D1','Eb1','F1','G1','Ab1', 'Bb1','C2', 'D2', 'Eb2', 'F2', 'G2', 'Ab2', 'Bb2'];}
		else if(scale=='all'){return ['C1', 'Db1', 'D1', 'Eb1', 'E1', 'F1', 'Gb1', 'G1', 'Ab1', 'A1', 'Bb1', 'B1', 'C2', 'Db2', 'D2', 'Eb2', 'E2', 'F2', 'Gb2', 'G2', 'Ab2', 'A2', 'Bb2', 'B2']}
		else {return DEFAULT_NOTES;}
	}	

	var Note = function(note){
		this.note = note;
		this.soundObj = null;
	}
	
	var DEFAULT = 0;
	var UP = 1;
	var RIGHT = 2;
	var DOWN = 3;
	var LEFT = 4;
	
	var states = [DEFAULT, UP, RIGHT, DOWN, LEFT];
			
	var blocks = [];
	var origBlocks = [];
	
	var MIN_SIZE = 0;
	var MAX_SIZE = 9;
	var SPEED = 225;
	var BLOCK_SIZE = 50;
	
	var ATTR_NOTE = 'note';
	var ATTR_STATE = 'state';
	var ATTR_BUSY = 'busy';
	var ATTR_BLOCK = 'block';
	
	var isRunning;
	
	$(function(){
		$('#speed').val(SPEED);		
		$('#size').val(MAX_SIZE);
		//any parameters to display?
		checkForParams();
		//gen the grid
		createGrid();
		//style any existing blocks		
		styleBlocks();
		
		$("#start").click(function(){
			if($("#start").text()=='Stop'){
				stop();
			} else {
				start();		
			}
		});
		$('#rebuild').click(function(){			
			rebuild();
		});
		$("#clear").click(function(){
			resetGrid();
			$("#start").text('Start');
		});
		$(".grid").mouseover(function(){
			$(this).css('backgroundColor', '#222');
		});
		$(".grid").mouseout(function(){
			if($(this).attr(ATTR_BUSY)=="false"){
				$(this).css('backgroundColor', '#111');
			}
		});
		$('#debug').css('left', $('#size').val()*50);
		$('#doLog').click(function(){
			changeScale();
		});
		$('#scale').change(function(){
			changeScale();
		})
		
		$('#save').click(function(){
			save();
		});
		
		$('#speed').change(function(){
			stop();
			start();
		});
		$('#soundbank').change(function(){
			changeSounds('true');
		});
	});
	
	function checkForParams(){
		if(location.href.indexOf('?')>-1){
			//looks like we have some parameters to load.
			$('#size').val(getParameterByName('size'));
			$('#speed').val(getParameterByName('speed'));
			$('#scale').val(getParameterByName('scale'));
			$('#soundbank').val(getParameterByName('bank'));
			$('#echo').attr('checked', getParameterByName('echo'));
			notes = new Scale(getParameterByName('scale'));
			var grid = getParameterByName('grid');
			var gridArr = grid.split(',');
			for(var i=0;i<gridArr.length;i++){
				var obj = gridArr[i].split(':');
				var xy = obj[0].split('_');
				createBlock(xy[0], xy[1], obj[1]);
			}
			origBlocks = blocks;
			location.href='#gt';
		}
	}
	
	//save the variables to the clipboard
	function save(){
		stop();
		var param = "";
		param += "size="+$('#size').val();
		param += "&scale="+$('#scale').val();
		param += "&speed="+$('#speed').val();
		param += "&bank="+$('#soundbank').val();
		param += "&echo="+$('#echo').attr('checked');
		var grid='';
		var state;
		
		if(origBlocks.length>0){
			for(var i=0;i<origBlocks.length;i++){
				if(origBlocks[i]!=='undefined'){
					state = origBlocks[i].state;
					if(state > DEFAULT){
						grid+=','+origBlocks[i].x+'_'+origBlocks[i].y+':'+state;
					}
				}
			}			
			grid = '&grid='+ grid.substring(1);
			param+=grid;
		}
		var url = '';
		var ref = location.href;
		if(ref.indexOf('?')>-1){
			url = ref.substring(0,ref.indexOf('?')+1)+param;
		} else {
			url = ref+'?'+param;
		}
		$('#url').html("<a href='"+url+"'>"+url+"</a><br>");
	}
	
	function getParameterByName( name ){
	  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	  var regexS = "[\\?&]"+name+"=([^&#]*)";
	  var regex = new RegExp( regexS );
	  var results = regex.exec( window.location.href );
	  if( results == null )
		return "";
	  else
		return decodeURIComponent(results[1].replace(/\+/g, " "));
	}	
	
	function stop(){
		clearInterval(isRunning);
		isRunning = null;
		for(var i in timeouts){
			clearTimeout(timeouts[i]);
		}
		$("#start").text('Start');	
	}
	
	function start(){
		isRunning = setInterval("run()", $('#speed').val());
		$("#start").text('Stop');
	}
	
	function changeScale(){
		stop();
		notes = new Scale($('#scale').val());
		$('#mainGrid').html('');
		createGrid();
		start();	
	}
	
	function rebuild(){
		notes = new Scale($('#scale').val());	
		$('#mainGrid').html('');
		resetGrid();
		createGrid();		
		stop();
	}
	

	
	function createGrid(){
		var mainGrid = $("#mainGrid" );
		var size = $('#size').val();
		for (var x = MIN_SIZE; x < size; x++){		 						
			for (var y = MIN_SIZE; y < size; y++){
				var n = notes[(x+y)%notes.length];			
				$("<div class='grid default' id='"+x+"_"+y+"' note='"+n+"'></div>")
					.appendTo(mainGrid)
					.css({left: ((x*BLOCK_SIZE) + "px"), top: ((y*BLOCK_SIZE) + "px")})											
					.click(function(){							
						checkState(this.id);						
					})
					.attr(ATTR_BUSY, "false");
				if($('#doLog:checked')[0]){
					$("#"+x+"_"+y).text( n );
				}				
			}			 
		}
		$('#debug').css('left', size*40);
	};			
	
	//primary block object
	var Block = function(x,y){
		this.x = x;
		this.y = y;
		this.id = genUnique();
		this.active = false;
		this.state = states[0];
		
		this.getGridObj = function(){
			return $('#'+this.x+'_'+this.y);
		};
		
		this.getState = function(){
			switch(this.state){
				case DEFAULT: return 'default';
				case RIGHT: return 'right';
				case LEFT: return 'left';
				case UP: return 'up';
				case DOWN: return 'down';
			}
		}
		
		this.move = function(){
			this.active = true;
			var gridObj = this.getGridObj();
			styleGrid(gridObj, DEFAULT);			
			gridObj.attr(ATTR_BLOCK, null);
			gridObj.attr(ATTR_BUSY, 'false');
			var size = $('#size').val();
			switch(this.state){
				case RIGHT:
					if(this.x == (size-1)){
						//reverse direction
						playTone(gridObj);
						this.state = LEFT;
						this.x--;							
					} else {
						this.x++;
					}
				break;
				case DOWN:
					if(this.y == (size-1)){
						//reverse direction
						playTone(gridObj);
						this.state = UP;
						this.y--;						
					} else {
						this.y++;
					}			
				break;
				case LEFT:
					if(this.x == MIN_SIZE){
						//reverse direction
						playTone(gridObj);
						this.state = RIGHT;
						this.x++;
					} else {
						this.x--;
					}			
				break;
				case UP:
					if(this.y == MIN_SIZE){
						//reverse direction
						playTone(gridObj);
						this.state = DOWN;
						this.y++;
					} else {
						this.y--;
					}
				break;
			}				
			//overwrite the old gridObj, since this block has now moved to a new gridObj
			gridObj = this.getGridObj();
			//add this block to the new grid object
			gridObj.attr(ATTR_BLOCK, this.id);
			styleGrid(gridObj, this.state);
		};
		
		this.rotate = function(){
			var gridObj = this.getGridObj();
			this.state++;
			if(this.state >= states.length){
				if(isRunning!=null){
					this.state = UP;
				} else {
					this.state = DEFAULT;
					this.active = 'false';
					gridObj.attr(ATTR_BUSY, 'false');
					gridObj.attr(ATTR_BLOCK, null);
					blocks.splice(blocks.indexOf(this),1);
				}
			}
			
			styleGrid(gridObj, this.state)
		};
		
		this.isNextCellCollision = function(block){
			var futureX = this.x;
			var futureY = this.y;
			var blockState = block.getState();			
			switch(this.state){
				case RIGHT:					
					if(this.futureX == (this.size-1)){
						this.futureX--;							
					} else {
						this.futureX++;
					}
				break;
				case DOWN:
					if(this.futureY == (this.size-1)){
						this.futureY--;						
					} else {
						this.futureY++;
					}			
				break;
				case LEFT:
					if(this.futureX == MIN_SIZE){
						this.futureX++;
					} else {
						this.futureX--;
					}			
				break;
				case UP:
					if(this.futureY == MIN_SIZE){
						this.futureY++;
					} else {
						this.futureY--;
					}
				break;
			}

			return (this.futureX==block.x && this.futureY==block.y);
		};
	}
	
	/*
	 * adds a new block if needed or updates an existing block.
	 */
	function checkState(id){
		var gridObj = $("#"+id);
		var block;
		var gridBlock = gridObj.attr(ATTR_BLOCK);
		if(gridBlock==null || gridBlock=='null'){
			//create a new block
			var coords = id.split('_');
			block = new Block(coords[0],coords[1]);
			blocks.push(block);
			//reference the block to the grid object
			var blockId = block.id;
			log('created blockId: '+blockId)
			gridObj.attr(ATTR_BLOCK, blockId);
			gridObj.attr(ATTR_BUSY, 'true');
		} else {
			//find the block based off of id;
			for(var i=0;i<blocks.length;i++){
				if(blocks[i].id == gridBlock){
					block = blocks[i];
					break;
				}
			}
		}
		block.rotate();			
		if(block.state > DEFAULT){
			playTone(gridObj);							
		}
		//save the blocks
		origBlocks = blocks;
	}
	
	function createBlock(x,y,state){
		var gridObj = $("#"+x+"_"+y);
		var block = new Block(x,y);
		block.state = Number(state);
		blocks.push(block);		
	}
	
	function styleBlocks(){
		var gridObj;
		for(var i=0;i<blocks.length;i++){
			gridObj = blocks[i].getGridObj();
			styleGrid(gridObj, Number(blocks[i].state));
			gridObj.attr(ATTR_BLOCK, blocks[i].id);
			gridObj.attr(ATTR_BUSY, 'true');
		}
	}
	
	function genUnique(){
		var r = function() {
		   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		};
		return (r()+"-"+r());		
	}
	
	function resetGrid(){
		stop();
		var mainGrid = $("#mainGrid" );		
		var size = $('#size').val();
		for (var x = MIN_SIZE; x < size; x++){		 
			for (var y = MIN_SIZE; y < size; y++){			 					
				$("#"+x+"_"+y)
					.attr(ATTR_STATE, DEFAULT)
					.attr(ATTR_BUSY, "false")
					.attr(ATTR_BLOCK, null)
					.css({"background":"#111"});
				$('#debug').html('');
			}			 
		}
		blocks = [];
	}		
	
	function run(){
		if(blocks.length==0){
			stop();
			return;
		}
		
		//move
		for(var i = 0; i< blocks.length;i++){
			block = blocks[i];				
			block.move();
		}
		
		var gridObj, gridObj2, block, blockIsDifferent;		
		//check to rotate
		busyBlocks = blocks;
		for(var i = 0; i< blocks.length;i++){
			block = blocks[i];
			for(var b=0;b<busyBlocks.length;b++){
				gridObj = block.getGridObj();
				gridObj2 = busyBlocks[b].getGridObj();
				blockIsDifferent = block != busyBlocks[b];
				//check if same grid, but different blocks
				if(gridObj[0].id==gridObj2[0].id && blockIsDifferent){
					block.rotate();
					log('collision:'+block.getState()+' grid: '+gridObj[0].id);				
				} 
				//else check if different grid && block, but predicted to collide with next step.
				//this can happen when they face eachother, and instead of switching places on the next cycle, they
				//should collide.
				else if(blockIsDifferent && block.isNextCellCollision(busyBlocks[b])) {
					block.rotate();
					block.move();
					log('collision:'+block.getState()+' grid: '+gridObj[0].id);
				}
			}
		}
	}
	
	function styleGrid(obj, state){
		switch(state){
			case DEFAULT:
				obj.css({background:'#111'});
			break;
			case LEFT:
				obj.css({background:'#222 url("imgs/left.png") no-repeat 5px 10px'});				
			break;
			
			case RIGHT:
				obj.css({background:'#222 url("imgs/right.png") no-repeat 5px 10px'});
			break;
			case UP:
				obj.css({background:'#222 url("imgs/up.png") no-repeat 5px 10px'});
			break;
			case DOWN:	
				obj.css({background:'#222 url("imgs/down.png") no-repeat 5px 10px'});
			break;
		}
	}	
	function playTone(obj){	
		var note = getSoundObj(obj.attr("note"));
		var soundPan = 0;
		var vol = 100;
		//get the id of the object which will tell me the x,y coord.
		var xy = obj[0].id.split('_');
		//sound panning goes from -100 to 100, so 200 is the range		
		var soundPan = Math.floor((200/(MAX_SIZE-1)) * xy[0] - 100);
		if(xy[0]==MAX_SIZE-1){
			soundPan = 100;
		}
		//sound volume goes from 0-100, but we only want 50 to be the min and 50 is the range
		var vol = Math.floor(Math.round((50/MAX_SIZE)) * xy[1] + 50);

		triggerSound(note, soundPan, vol);
		obj.effect("highlight", {color:"#ccc"}, (isRunning==null)?100:1000);
		if($('#echo:checked')[0]){
			playEcho(note, soundPan, vol);
		}
		log('--== '+obj.attr("note")+' ==--');
		log(soundPan+':'+vol);
	}
	
	//hold reference to timeouts, so they can be killed later if they have been bad.
	var timeouts = [];
	function playEcho(noteObj, soundPan, vol){		
		var speed = $('#speed').val();
		timeouts.push(setTimeout(function(){triggerSound(noteObj,soundPan, Math.floor(vol/4))}, speed*2));
		timeouts.push(setTimeout(function(){triggerSound(noteObj,soundPan, Math.floor(vol/8))}, speed*4));
		timeouts.push(setTimeout(function(){triggerSound(noteObj,soundPan, Math.floor(vol/16))}, speed*6));
		timeouts.push(setTimeout(function(){triggerSound(noteObj,soundPan, Math.floor(vol/32))}, speed*10));
	}
	
	function triggerSound(note, soundPan, vol){		
		eval(note.play({pan:soundPan, volume:vol}));
	}
	
	function log(message){
		if($('#doLog:checked')[0]){
			$('#debug').prepend('<br>'+message);
		}
	}

	function getSoundObj(note){
		for(var i in sounds){
			if(sounds[i].note==note){
				return sounds[i].soundObj;
			}
		}
	}
	
	// setup the soundManager object
	soundManager.url = 'swf/'
	soundManager.debugMode = false;
	soundManager.useFlashBlock = false;
	soundManager.flashVersion = 9;
	//soundManager.useHTML5Audio = true;
	//middle c plus one full octave
	var sounds = [
		new Note('C1'),
		new Note('Db1'),
		new Note('D1'),
		new Note('Eb1'),
		new Note('E1'),
		new Note('F1'),
		new Note('Gb1'),
		new Note('G1'),
		new Note('Ab1'),
		new Note('A1'),
		new Note('Bb1'),
		new Note('B1'),
		new Note('C2'),
		new Note('Db2'),
		new Note('D2'),
		new Note('Eb2'),
		new Note('E2'),
		new Note('F2'),
		new Note('Gb2'),
		new Note('G2'),
		new Note('Ab2'),
		new Note('A2'),
		new Note('Bb2'),
		new Note('B2')
	];
	soundManager.onready(function() {	
		changeSounds();
	});
	
	
	function changeSounds(doStart){
		var soundbank = $('#soundbank').val();
		stop();
		//remove all the old sounds
		for(var i in sounds){
			try{
				eval(sounds[i].soundObj).destruct();
			} catch(e){
				//ignore... first run this will always be null. after that if it is null, 
				//there is no soundObj to worry about.
			}
		}	
		var urlpost = '.mp3';		
		var mid;
		if(soundbank=='picat'){
			var urlpre = 'mp3s/piccata/picat0';										
		} else if(soundbank=='guita'){
			var urlpre = 'mp3s/guit/guita0';										
		} else if(soundbank=='piano'){
			var urlpre = 'mp3s/piano/piano0';										
		} else if(soundbank=='vib'){
			var urlpre = 'mp3s/vibra/vib0';										
		} else if(soundbank=='fem'){
			var urlpre = 'mp3s/femvox/fem0';										
		} else if(soundbank=='old'){
			var urlpre = 'mp3s/oldsine/old0';										
		}
		
		for(var i in sounds){
			mid = i;
			if(i<10){ mid = '0'+mid;}
			sounds[i].soundObj = soundManager.createSound({id: sounds[i].note,	url: urlpre+mid+urlpost});
		}
		
		if(doStart=='true'){
			start();
		}
	}
	
	soundManager.ontimeout(function() {
		alert('something is not working. sorry for wasting your time. please forgive me. ');
	});