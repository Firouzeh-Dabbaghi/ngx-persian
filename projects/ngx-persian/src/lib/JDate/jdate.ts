import {JalaliDateCalculatorService} from './jalali-date-calculator.service';
import {InvalidJalaliDateError} from './InvalidJalaliDate.error';

/**
 * This class represents a complete Date object for Jalali dates. It accepts jalali Dates, converts Georgian dates to jalali and implements
 * all the behaviours of default Date object of JavaScript for Jalali Date, plus some additional methods for developers convenience.
 * ATTENTION:
 * UTC methods are not implemented for Jalali date. They working directly on gDate object (Corresponding date in Georgian) and changing
 * properties of this. Then new JDate object will create from the modified Georgian Date. So they may Cause unpredictable behaviour.
 * Please don't use UTC methods with "todo" tag on them unless you are sure about the behaviour.
 * Recreating objects are safer than working with UTC methods.
 */
export class JDate implements Date{

  private static EN_MONTHS = ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Behman', 'Esfand'];
  private static FA_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  private static DAYS_OF_WEEK = ['جمعه', 'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه'];
  private static EN_DAYS_OF_WEEK = ['Jom\'e', 'Shanbe', 'Yekshanbe', 'Doshanbe', 'Seshanbe', 'Cheharshanbe', 'Panjshanbe'];
  private static COMPLETE_BEFORE_NOON = 'قبل از ظهر';
  private static COMPLETE_AFTER_NOON = 'بعد از ظهر';
  private static SHORT_BEFORE_NOON = 'ق.ظ';
  private static SHORT_AFTER_NOON = 'ب.ظ';

  private _gDate: Date;
  private _jYear: number;
  private _jMonth: number;
  private _jDay: number;

  /**
   * If input value length is shorter than desiredLength, adds zeros at the beginning of it until meets desired length.
   * @param value a number or string that we want have a specific length
   * @param desiredLength
   */
  public static zeroPadding(value: number | string, desiredLength): string {
    value = value.toString();
    while (value.length < desiredLength) {
      value = '0' + value;
    }
    return value;
  }

  /**
   * Extracts Georgian Date object from a Jalali date string.
   * @param dateString a Jalali date string following this pattern: "yyyy mmm dd HH:MM:SS" or this pattern: "yyyy mmmm dd HH:MM:SS".
   * example: '11 دی 1348 00:00:00' or '11 Dey 1348 00:00:00'
   * @param calculator Jalali calculator service injected using DI
   * @return a Georgian Date object.
   */
  public static parse(dateString: string, calculator: JalaliDateCalculatorService = new JalaliDateCalculatorService()): number {
    const dateArray = dateString.split(' ');
    if (dateArray.length < 3) { throw new InvalidJalaliDateError(); }
    const day = parseInt(dateArray[0]);
    let month = JDate.FA_MONTHS.indexOf(dateArray[1]);
    if (month === -1) { month = JDate.EN_MONTHS.indexOf(dateArray[1]); }
    if (month === -1) { throw new InvalidJalaliDateError(); }
    const year = parseInt(dateArray[2]);
    const timeArray = dateArray.length > 3 ? dateArray[3].split(':') : ['0', '0', '0'];
    const hour = parseInt(timeArray[0]);
    const min = parseInt(timeArray[1]);
    const sec = parseInt(timeArray[2]);
    const gDate = calculator.convertToGeorgian(year, month, day);
    gDate.setHours(hour, min, sec);
    return gDate.getTime();
  }


  /**
   * For creating a JDate object, you have 5 different options.
   * 1- If you want to have current date and time, you can simply call new JDate() without any parameter.
   * 2- If you want to create JDate object from a jalali date string as described in the `pars` method document, you can pass that string as
   *    first parameter and leave others empty.
   * 3 - If you want to create JDate object from number of passed milliseconds from UNIX epoch (for example creating a Jalali date object
   *     from result of getTime method of another Date object), you can pass the number as first parameter and leave others alone.
   * 4 - If you want to create JDate object from a Georgian Date object, you can simply pass that Date object as first parameter and leave
   *     others empty.
   * 5- If you want to create JDate object from date and time values, you can simply fill corresponding parameters of each date and time
   * value to the constructor. You don't have to fill all of the parameters. only those you need. other parameters will fill with zero.
   * Examples of all of those scenarios:
   * 1) new JDate()
   * 2) new JDate('11 دی 1348 00:00:00')
   * 3) new JDate(-12600000)
   * 4) new JDate(new Date(2018, 1, 1))
   * 5) new JDate(1397, 12, 25) or new JDate(1397, 12, 25, 12, 32, 45, 123)
   *
   * @param jYear
   * @param jMonth
   * @param jDay
   * @param hours
   * @param minutes
   * @param seconds
   * @param milliseconds
   * @param calculator
   */
  constructor(jYear?: number | string | Date, jMonth?: number, jDay?: number, hours: number = 0, minutes: number = 0,
              seconds: number = 0, milliseconds: number = 0, private calculator: JalaliDateCalculatorService = new JalaliDateCalculatorService()) {
    if (!jYear) {
      this._createFromDate(new Date());
    } else if (typeof jYear === 'string' && jMonth === undefined) {
      this._createFromDate(new Date(JDate.parse(jYear)));
    } else if (typeof jYear === 'number' && jMonth === undefined) {
      this._createFromDate(new Date(jYear));
    } else if (jYear instanceof Date && jMonth === undefined) {
      this._createFromDate(jYear);
    }
    else {
      // @ts-ignore
      this._gDate = this.calculator.convertToGeorgian(jYear, jMonth, jDay);
      // @ts-ignore
      this._jYear = jYear;
      this._jMonth = jMonth;
      this._jDay = jDay;
      this._gDate.setHours(hours, minutes, seconds, milliseconds);
    }
    this._check_date_validity();
  }

  /**
   * This method recalculates the gDate value with private attributes those storing Jalali date parts.
   * @private
   */
  private _renewGDate(): void {
    this._gDate = this.calculator.convertToGeorgian(this._jYear, this._jMonth, this._jDay);
  }

  /**
   * Sets Jalali year value to the input parameter and recalculates gDate attribute.
   * @param value full Jalali year like 1397
   */
  private set jYear(value: number) {
    this._jYear = value;
    this._check_date_validity();
    this._renewGDate();
  }

  /**
   * Sets Jalali month value to the input parameter and recalculates gDate attribute.
   * @param value month number starting from zero
   */
  private set jMonth(value: number) {
    this._jMonth = value;
    this._check_date_validity();
    this._renewGDate();
  }

  /**
   * Sets Jalali day value to the input parameter and recalculates gDate attribute.
   * @param value day number starting from 1.
   */
  private set jDay(value: number) {
    this._jDay = value;
    this._check_date_validity();
    this._renewGDate();
  }

  /**
   * throws InvalidJalaliDateError when date values of this object won't represent a valid Jalali date.
   * @throws InvalidJalaliDateError
   * @private
   */
  private _check_date_validity(): void{
    if (!this.calculator.validator.isValidJDate(this._jYear, this._jMonth, this._jDay)) { throw new InvalidJalaliDateError(); }
  }

  /**
   * Calculates Jalali year from Georgian Date object and sets the attributes of the object to proper values.
   * @param gDate
   * @private
   */
  private _createFromDate(gDate: Date) {
    const conversionResult = this.calculator.convertToJalali(gDate);
    this._jYear = conversionResult.year;
    this._jMonth = conversionResult.month;
    this._jDay = conversionResult.day;
    this._gDate = gDate;
  }

  [Symbol.toPrimitive](hint: "default"): string;

  [Symbol.toPrimitive](hint: "string"): string;

  [Symbol.toPrimitive](hint: "number"): number;

  [Symbol.toPrimitive](hint: string): string | number;

  [Symbol.toPrimitive](hint: "default" | "string" | "number" | string): string | number {
    return undefined;
  }

  /**
   * returns the day of the month for the specified date according to local time.
   */
  getDate(): number {
    return this._jDay;
  }

  /**
   *  returns the day of the week for the specified date according to local time, where 0 represents Friday and 6 is Thursday.
   */
  getDay(): number {
    return (this._gDate.getDay() + 2) % 7;
  }

  /**
   * Returns the year (4 digits for 4-digit years) of the specified date according to local time
   */
  getFullYear(): number {
    return this._jYear;
  }

  /**
   * Returns the hour for the specified date, according to local time.
   */
  getHours(): number {
    return this._gDate.getHours();
  }

  /**
   * Converts default 24-hour clock hour value to the 12-hour clock version.
   * @return a number between 1 to 12
   */
  getHours12hourClock(): number {
    const result = this.getHours() % 12;
    return result ? result : 12;
  }

  /**
   * Returns the milliseconds in the specified date according to local time.
   */
  getMilliseconds(): number {
    return this._gDate.getMilliseconds();
  }

  /**
   * Returns the minutes in the specified date according to local time.
   */
  getMinutes(): number {
    return this._gDate.getMinutes();
  }

  /**
   * Returns the month in the specified date according to local time, as a zero-based value
   * where zero indicates the first month of the year.
   */
  getMonth(): number {
    return this._jMonth;
  }

  /**
   * Returns the seconds in the specified date according to local time.
   */
  getSeconds(): number {
    return this._gDate.getSeconds();
  }

  /**
   *  Returns the number of milliseconds* since the Unix Epoch.
   * JavaScript uses milliseconds as the unit of measurement, whereas Unix Time is in seconds.
   * getTime() always uses UTC for time representation. For example, a client browser in one timezone, getTime() will be the same as a
   * client browser in any other timezone.
   *You can use this method to help assign a date and time to another Date object. This method is functionally equivalent to the valueOf() method.
   */
  getTime(): number {
    return this._gDate.getTime();
  }

  /**
   * Returns the time zone difference, in minutes, from current locale (host system settings) to UTC
   * Attention: Not implemented
   * @todo add implementation
   */
  getTimezoneOffset(): number {
    return this._gDate.getTimezoneOffset();
  }

  /**
   * Output is not jalali day.
   * @todo add implementation
   */
  getUTCDate(): number {
    return this._gDate.getUTCDate();
  }

  /**
   * Output is not jalali day.
   * @todo add implementation
   */
  getUTCDay(): number {
    return this._gDate.getUTCDay();
  }

  /**
   * Output is not a Jalali Year.
   * @todo add implementation
   */
  getUTCFullYear(): number {
    return this._gDate.getUTCFullYear();
  }

  /**
   * @todo add implementation
   */
  getUTCHours(): number {
    return this._gDate.getUTCHours();
  }

  /**
   * @todo add implementation
   */
  getUTCMilliseconds(): number {
    return this._gDate.getUTCMilliseconds();
  }

  /**
   * @todo add implementation
   */
  getUTCMinutes(): number {
    return this._gDate.getUTCMinutes();
  }

  /**
   * Output is not a Jalali Year.
   * @todo add implementation
   */
  getUTCMonth(): number {
    return this._gDate.getUTCMonth();
  }

  /**
   * @todo add implementation
   */
  getUTCSeconds(): number {
    return this._gDate.getUTCSeconds();
  }

  /**
   * sets the day of the JDate object relative to the beginning of the currently set month.
   * @param date day number starts from 1.
   * @return The number of milliseconds between 1 January 1970 00:00:00 UTC and the given date (the Date object is also changed in place).
   */
  setDate(date: number): number {
    this.jDay = date;
    return this.getTime();
  }

  /**
   * sets the full year for a specified date according to local time. Returns new timestamp.
   * @param year full Jalali year like 1397
   * @param month number of month starting from 0
   * @param date number of day starting from 1
   */
  setFullYear(year: number, month?: number, date?: number): number {
    this.jYear = year;
    if (month) { this.jMonth = month; }
    if (date) {this.jDay = date; }
    return this.getTime();
  }

  /**
   * Sets the hours for a specified date according to local time, and returns the number of milliseconds since
   * January 1, 1970 00:00:00 UTC until the time represented by the updated JDate instance.
   * @param hours An integer between 0 and 23, representing the hour
   * @param min An integer between 0 and 59, representing the minutes.
   * @param sec An integer between 0 and 59, representing the seconds.
   * @param ms A number between 0 and 999, representing the milliseconds.
   * @return The number of milliseconds between January 1, 1970 00:00:00 UTC and the updated date.
   */
  setHours(hours: number, min?: number, sec?: number, ms?: number): number {
    this._gDate.setHours(hours);
    if (min !== undefined) { this.setMinutes(min); }
    if (sec !== undefined) { this.setSeconds(sec); }
    if (ms !== undefined) { this.setMilliseconds(ms); }
    return this.getTime();
  }

  /**
   * Sets the milliseconds for a specified date according to local time.
   * @param ms A number between 0 and 999, representing the milliseconds.
   * @return The number of milliseconds between 1 January 1970 00:00:00 UTC and the updated date.
   */
  setMilliseconds(ms: number): number {
    this._gDate.setMilliseconds(ms);
    return this.getTime();
  }

  /**
   * Sets the minutes for a specified date according to local time.
   * @param min An integer between 0 and 59, representing the minutes.
   * @param sec An integer between 0 and 59, representing the seconds.
   * @param ms A number between 0 and 999, representing the milliseconds.
   * @return The number of milliseconds between 1 January 1970 00:00:00 UTC and the updated date.
   */
  setMinutes(min: number, sec?: number, ms?: number): number {
    this._gDate.setMinutes(min);
    if(sec !== undefined) { this.setSeconds(sec); }
    if (ms !== undefined) { this.setMilliseconds(ms); }
    return this.getTime();
  }

  /**
   * Sets the month for a specified date according to the currently set year.
   * @param month An integer between 0 and 11, representing the months Farvardin through Esfand.
   * @param date An integer from 1 to 31, representing the day of the month.
   * @return The number of milliseconds between 1 January 1970 00:00:00 UTC and the updated date.
   */
  setMonth(month: number, date?: number): number {
    this.jMonth = month;
    if (date !== undefined) { this.jDay = date; }
    return this.getTime();
  }

  /**
   * Sets the seconds for a specified date according to local time.
   * @param sec An integer between 0 and 59, representing the seconds.
   * @param ms A number between 0 and 999, representing the milliseconds.
   * @return The number of milliseconds between 1 January 1970 00:00:00 UTC and the updated date.
   */
  setSeconds(sec: number, ms?: number): number {
    this._gDate.setSeconds(sec);
    if (ms !== undefined) { this.setMilliseconds(ms); }
    return this.getTime();
  }

  /**
   * Sets the JDate object to the time represented by a number of milliseconds since January 1, 1970, 00:00:00 UTC.
   * @param time sets the Date object to the time represented by a number of milliseconds since January 1, 1970, 00:00:00 UTC.
   * @return The number of milliseconds between 1 January 1970 00:00:00 UTC and the updated date.
   */
  setTime(time: number): number {
    this._createFromDate(new Date(time));
    return time;
  }

  /**
   * sets the day of the month for a specified date according to universal time.
   * Then recreate the JDate object from new Georgian object.
   * @param  date An integer from 1 to 31, representing the day of the month.
   * @return The number of milliseconds between 1 January 1970 00:00:00 UTC and the updated date.
   * @todo add implementation
   */
  setUTCDate(date: number): number {
    this._gDate.setUTCDate(date);
    this._createFromDate(this._gDate);
    return this.getTime();
  }

  /**
   * Sets the full year for a specified date according to universal time.
   * Then recreate the JDate object from new Georgian object.
   * @param year  An integer specifying the numeric value of the year, for example, 1995.
   * @param month  Optional. An integer between 0 and 11 representing the months January through December.
   * @param date An integer between 1 and 31 representing the day of the month. If you specify the dayValue parameter, you must also
   * specify the monthValue.
   * @todo add implementation
   */
  setUTCFullYear(year: number, month?: number, date?: number): number {
    this._gDate.setUTCFullYear(year, month, date);
    this._createFromDate(this._gDate);
    return this.getTime();
  }

  /**
   * Sets the hour for a specified date according to universal time, and returns the number of milliseconds since
   * January 1, 1970 00:00:00 UTC until the time represented by the updated Date instance.
   * Then recreate the JDate object from new Georgian object.
   * @param hours  An integer between 0 and 23, representing the hour.
   * @param min Optional. An integer between 0 and 59, representing the minutes.
   * @param sec Optional. An integer between 0 and 59, representing the seconds. If you specify the secondsValue parameter,
   *        you must also specify the minutesValue.
   * @param ms Optional. A number between 0 and 999, representing the milliseconds. If you specify the msValue parameter,
   *        you must also specify the minutesValue and secondsValue.
   * @return The number of milliseconds between January 1, 1970 00:00:00 UTC and the updated date.
   * @todo add implementation
   */
  setUTCHours(hours: number, min?: number, sec?: number, ms?: number): number {
    this._gDate.setUTCHours(hours, min, sec, ms);
    this._createFromDate(this._gDate);
    return this.getTime();
  }

  /**
   * Sets the milliseconds for a specified date according to universal time.
   * Then recreate the JDate object from new Georgian object.
   * @param ms A number between 0 and 999, representing the milliseconds.
   * @return The number of milliseconds between 1 January 1970 00:00:00 UTC and the updated date.
   * @todo add implementation
   */
  setUTCMilliseconds(ms: number): number {
    this._gDate.setUTCMilliseconds(ms);
    this._createFromDate(this._gDate);
    return this.getTime();
  }

  /**
   * Sets the minutes for a specified date according to universal time.
   * Then recreate the JDate object from new Georgian object.
   * @param min An integer between 0 and 59, representing the minutes.
   * @param sec Optional. An integer between 0 and 59, representing the seconds. If you specify the secondsValue parameter,
   *        you must also specify the minutesValue.
   * @param ms Optional. A number between 0 and 999, representing the milliseconds. If you specify the msValue parameter,
   *        you must also specify the minutesValue and secondsValue.
   * @return The number of milliseconds between 1 January 1970 00:00:00 UTC and the updated date.
   * @todo add implementation
   */
  setUTCMinutes(min: number, sec?: number, ms?: number): number {
    this._gDate.setUTCMinutes(min, sec, ms);
    this._createFromDate(this._gDate);
    return this.getTime();
  }

  /**
   * Sets the month for a specified date according to universal time.
   * Then recreate the JDate object from new Georgian object.
   * @param month An integer between 0 and 11, representing the months January through December.
   * @param date Optional. An integer from 1 to 31, representing the day of the month.
   * @return The number of milliseconds between 1 January 1970 00:00:00 UTC and the updated date.
   * @todo add implementation
   */
  setUTCMonth(month: number, date?: number): number {
    this._gDate.setUTCMonth(month, date);
    this._createFromDate(this._gDate);
    return this.getTime();
  }

  /**
   * Sets the seconds for a specified date according to universal time.
   * Then recreate the JDate object from new Georgian object.
   * @param sec An integer between 0 and 59, representing the seconds.
   * @param ms Optional. A number between 0 and 999, representing the milliseconds.
   * @todo add implementation
   */
  setUTCSeconds(sec: number, ms?: number): number {
    this._gDate.setUTCSeconds(sec, ms);
    this._createFromDate(this._gDate);
    return this.getTime();
  }

  /**
   * Returns name of the day of the week in persian.
   * @return name of the day
   */
  getNameOfTheDay(): string {
    return JDate.DAYS_OF_WEEK[this.getDay()];
  }

  /**
   * @return name of the month in persian. ex: مهر
   */
  getNameOfTheMonth(): string {
    return JDate.FA_MONTHS[this.getMonth()];
  }

  /**
   * returns the date portion of a Date object in human readable form in Persian.
   * @return a string following this pattern: "nameOfTheDay nameOfTheMonth dayNumber fullYear". ex: پنج‌شنبه اسفند 30 1375
   */
  toDateString(): string {
    return `${this.getNameOfTheDay()} ${this.getNameOfTheMonth()} ${this.getDate()} ${this.getFullYear()}`;
  }

  /**
   * Returns time marker of object time. all hour numbers lesser than 12 are before noon and all greater than 12 are after noon.
   * @param shortVersion controls output. if be true, output will be in short format like: ب.ظ if be false, output will be in complete format like: بعد از ظهر
   * @return time marker for showing if time is before noon or after it
   */
  getTimeMarker(shortVersion: boolean = false): string {
    if (this.getHours() < 12) { return shortVersion ? JDate.SHORT_BEFORE_NOON : JDate.COMPLETE_BEFORE_NOON; }
    return shortVersion ? JDate.SHORT_AFTER_NOON : JDate.COMPLETE_AFTER_NOON;
  }

  /**
   * Replace patterns of date formatting with corresponding strings from JDate object values.
   * In bi-character pattern parts, missed digits will fill with zero.
   * @param pattern a pattern string with replaceable parts:
   *        yyyy -> Year number in 4-digit representation. ex: 1397
   *        yy -> Year number in 2-digit representation. ex: 97
   *        mmmm -> Name of the month in English representation. ex: Esfand
   *        mmm -> Name of the month in Persian representation. ex: اسفند
   *        mm -> 2-digit number of the month starting from 1
   *        m -> non zero-padding number of the month starting from 1
   *        dddd -> Name of the day in the week in English representation. ex: Shanbe
   *        ddd -> Name of the day in the week id Persian representation. ex: شنبه
   *        dd -> 2-digit number of the day in the month starting from 1
   *        d -> non zero-padding number of the day in the month starting from 1
   * @return A formatted string that all Date patter parts has been replaced. Other characters of the pattern will left unchanged.
   * @private
   */
  private _format_date(pattern: string): string {
    return pattern.replace(/yyyy/g, JDate.zeroPadding(this.getFullYear(), 4))
      .replace(/\byy\b/g, (this.getFullYear() % 100).toString())
      .replace(/\bmmmm\b/g, JDate.EN_MONTHS[this.getMonth()])
      .replace(/\bmmm\b/g, JDate.FA_MONTHS[this.getMonth()])
      .replace(/\bmm\b/g, JDate.zeroPadding(this.getMonth() + 1, 2))
      .replace(/\bm\b/g, (this.getMonth() + 1).toString())
      .replace(/\bdddd\b/g, JDate.EN_DAYS_OF_WEEK[this.getDay()])
      .replace(/\bddd\b/g, JDate.DAYS_OF_WEEK[this.getDay()])
      .replace(/\bdd\b/g, JDate.zeroPadding(this.getDate(), 2))
      .replace(/\bd\b/g, this.getDate().toString())
  }

  /**
   * Replace patterns of time formatting with corresponding strings from JDate object values.
   * In bi-character pattern parts, missed digits will fill with zero.
   * @param pattern a pattern string with replaceable parts:
   *        HH -> 2-digit form of hour number in 24-hour clock format.
   *        H -> non zero-padding form of hour number in 24-hour clock format.
   *        hh -> 2-digit form of hour number in 12-hour clock format.
   *        H -> non zero-padding form of hour number in 12-hour clock format.
   *        MM -> 2-digit form of minutes number.
   *        M -> non zero-padding form of minutes number
   *        SS -> 2-digit form of seconds number.
   *        S -> non zero-padding form of seconds number.
   *        l -> number of milliseconds
   *        T -> Time marker in full format like: قبل از ظهر
   *        t -> Time marker in short format like: ق.ظ
   * @private
   */
  private _format_time(pattern: string): string {
    return pattern.replace(/\bHH\b/g, JDate.zeroPadding(this.getHours(), 2))
      .replace(/\bH\b/g, this.getHours().toString())
      .replace(/\bhh\b/g, JDate.zeroPadding(this.getHours12hourClock(), 2))
      .replace(/\bh\b/g, this.getHours12hourClock().toString())
      .replace(/\bMM\b/g, JDate.zeroPadding(this.getMinutes(), 2))
      .replace(/\bM\b/g, this.getMinutes().toString())
      .replace(/\bSS\b/g, JDate.zeroPadding(this.getSeconds(), 2))
      .replace(/\bS\b/g, this.getSeconds().toString())
      .replace(/\bl\b/g, this.getMilliseconds().toString())
      .replace(/\bT\b/g, this.getTimeMarker(false))
      .replace(/\bt\b/g, this.getTimeMarker(true));
  }

  /**
   * This method format date and time stored in the JDate object according to the entered pattern.
   * Only masks will replace and all other characters will be unchanged after formatting.
   * You can use masks several times in a pattern but be careful because if some of masks written immediately, they create new masks with
   * different meaning. It's better to always have some splitter characters between different masks.
   * @param pattern a string containing zero or more formatting mask.
   * Masks:
   *        yyyy -> Year number in 4-digit representation. Leading zero for years lesser than 1000 ex: 1397
   *        yy -> Year number in 2-digit representation without Leading zeros. ex: 97
   *        mmmm -> Name of the month in English representation. ex: Esfand
   *        mmm -> Name of the month in Persian representation. ex: اسفند
   *        mm -> 2-digit number of the month starting from 1. Leading zero for single-digit months.
   *        m -> number of the month starting from 1 without Leading zeros.
   *        dddd -> Name of the day in the week in English representation. ex: Shanbe
   *        ddd -> Name of the day in the week id Persian representation. ex: شنبه
   *        dd -> 2-digit number of the day in the month starting from 1. Leading zero for single-digit days.
   *        d -> number of the day in the month starting from 1 without Leading zeros.
   *        HH -> 2-digit form of hour number in 24-hour clock format. Leading zero for single-digit hours.
   *        H -> non zero-padding form of hour number in 24-hour clock format without Leading zeros.
   *        hh -> 2-digit form of hour number in 12-hour clock format. Leading zero for single-digit hours.
   *        H -> non zero-padding form of hour number in 12-hour clock format without Leading zeros.
   *        MM -> 2-digit form of minutes number. Leading zero for single-digit minutes.
   *        M -> non zero-padding form of minutes number without Leading zeros.
   *        SS -> 2-digit form of seconds number. Leading zero for single-digit seconds.
   *        S -> non zero-padding form of seconds number without Leading zeros.
   *        l -> number of milliseconds without Leading zeros.
   *        T -> Time marker in full format like: قبل از ظهر
   *        t -> Time marker in short format like: ق.ظ
   *@return formatted dateTime string.
   */
  format(pattern: string): string {
    return this._format_time(this._format_date(pattern));
  }

  /**
   * @return a string in simplified extended ISO format (ISO 8601), which is always 24 or 27 characters long (yyyy-mm-ddTHH:MM:SS.lZ).
   *        Be careful because that T in the middle of the pattern is not a format Mask and is a simple character.
   */
  toISOString(): string {
    return this.format('yyyy-mm-dd') + 'T' + this.format('HH:MM:SS.l') + 'Z';
  }

  /**
   * returns a string representation of the Date object.
   * @param key
   */
  toJSON(key?: any): string {
    return this.toISOString();
  }

  /**
   * eturns a string with a language sensitive representation of the date portion of this date.
   * The new locales and options arguments let applications specify the language whose formatting conventions
   * should be used and allow to customize the behavior of the function. In older implementations,
   * which ignore the locales and options arguments, the locale used and the form of the string returned are
   * entirely implementation dependent.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
   */
  toLocaleDateString(): string;
  toLocaleDateString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;
  toLocaleDateString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string {
    return this._gDate.toLocaleDateString(locales, options);
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleTimeString
   */
  toLocaleTimeString(): string;
  toLocaleTimeString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string;
  toLocaleTimeString(locales?: string | string[], options?: Intl.DateTimeFormatOptions): string {
    return this._gDate.toLocaleTimeString(locales, options);
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toTimeString
   */
  toTimeString(): string {
    return this._gDate.toTimeString();
  }

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toUTCString
   * @todo add implementation
   */
  toUTCString(): string {
    return this._gDate.toUTCString();
  }

  /**
   * Similar to the getTime method.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/valueOf
   */
  valueOf(): number {
    return this.getTime();
  }
}