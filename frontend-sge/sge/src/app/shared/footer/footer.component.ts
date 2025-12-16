import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  yyyy: number;
  copyrightName: string = 'Eliana';


  constructor() { }

  ngOnInit() {
    this.yyyy = new Date().getFullYear();
  }

}
