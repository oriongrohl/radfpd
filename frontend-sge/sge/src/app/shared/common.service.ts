import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor(private cookieService: CookieService) {  }

  
  //! headerspython es un getter que devuelve los headers con el token incluido para las peticiones al backend de python 
  get headersPython() { // se llama en los componentes
    const token = localStorage.getItem('token_python'); //! buscamos el token en localstorage que se ha debido de almacenar en login.compontent.ts
    let headers = new HttpHeaders({ 
        'Content-Type': 'application/json' // aclaramos quue el contenido es un json para que el backend lo pueda interpretar correctamente
    });
    
    //! A TENER EN CUENTA EL BACKEND
    /* * 
        * security = HTTPBearer()
        * def verificar_token(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict: //? con depends(security) le decimos a fastapi que el endpoint requiere autenticacion
          *  token = creds.credentials  * */
    if (token && token !== 'null' && token !== 'undefined') { //! DEFINIMOS LA AUTENTICACION EN EL FRONTEND
        headers = headers.append('Authorization', `Bearer ${token}`); //! 1 ENVIO AL BACKEND -> lo recibe aqui security = HTTPBearer()
    }
    
    return { headers: headers }; // devolvemos el objeto
  }

  public static divideEvenly(numerator, minPartSize) {
    if (numerator / minPartSize < 2) {
      return [numerator];
    }
    return [minPartSize].concat(this.divideEvenly(numerator - minPartSize, minPartSize));
  }

  public static divideCurrencyEvenly(numerator, divisor) {
    const minPartSize = +(numerator / divisor).toFixed(2);
    return this.divideEvenly(numerator * 100, minPartSize * 100).map( v => {
      return (v / 100).toFixed(2);
    });
  }

  // devuelve la fecha en formato YYYY-MM-DD (string) teniendo en cuenta el UTC para las zonas horarias
  public static fechaFormateada(inputDeFecha) {
    return new Date(new Date(inputDeFecha).getTime() - (new Date(inputDeFecha).getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
  }

  public static fill = (n, x) =>
    Array(n).fill(x)

  public static concat = (xs, ys) =>
    xs.concat(ys)

  public static quotrem = (n, d) =>
    [Math.floor(n / d)
      , Math.floor(n % d
        )
    ]

  public static distribute = (p, d, n) => {
    const e =
      Math.pow(10, p);

    const [q, r] =
      CommonService.quotrem(n * e, d);

    return CommonService.concat
      (CommonService.fill(r, (q + 1) / e)
        , CommonService.fill(d - r, q / e)
      );
  }

  getHeaders() {
    return new HttpHeaders({
      'Content-Type':  'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    });
  }


  base64toPDF(data, id) {
    const bufferArray = this.base64ToArrayBuffer(data);
    const blobStore = new Blob([bufferArray], { type: 'application/pdf' });
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blobStore);
        return;
    }
    data = window.URL.createObjectURL(blobStore);
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.href = data;
    link.download = `${id}.pdf`;
    link.click();
    window.URL.revokeObjectURL(data);
    link.remove();
  }

  base64ToArrayBuffer(data) {
      const bString = window.atob(data);
      const bLength = bString.length;
      const bytes = new Uint8Array(bLength);
      for (let i = 0; i < bLength; i++) {
          const ascii = bString.charCodeAt(i);
          bytes[i] = ascii;
      }
      return bytes;
  }

  fechaFormateada(inputDeFecha) {
    if (inputDeFecha) {
      return new Date(new Date(inputDeFecha).getTime() - (new Date(inputDeFecha).getTimezoneOffset() * 60000))
      .toISOString()
      .split('T')[0];
    } else {
      return null;
    }
    }

    get headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

}
